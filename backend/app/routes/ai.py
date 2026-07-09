import os
import json
import math
import time
import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from huggingface_hub import InferenceClient
from ..models import db, Question, Subject, CourseOutcome, User, AILog
from ..services.ai_provider import get_active_ai_provider
from ..services.rbac_service import get_settings, has_subject_permission

bp = Blueprint('ai', __name__)

def cosine_similarity(v1, v2):
    dot_product = sum(a*b for a, b in zip(v1, v2))
    magnitude1 = math.sqrt(sum(a*a for a in v1))
    magnitude2 = math.sqrt(sum(b*b for b in v2))
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)

def extract_text_from_blocks(blocks):
    text_parts = []
    for block in blocks:
        data = block.get('data', {})
        if block['type'] in ['header', 'paragraph']:
            text_parts.append(data.get('text', ''))
        elif block['type'] == 'list':
            items = data.get('items', [])
            text_parts.extend(items)
        elif block['type'] == 'math':
            text_parts.append(data.get('latex', '') or data.get('mathml', ''))
    return "\n".join(text_parts)

@bp.route('/admin/ai/generate-paper', methods=['POST'])
@jwt_required()
def generate_paper():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        subject_id = data.get('subjectId')
        
        # Verify Contextual Permissions: Admin, Super Admin, or COE for this subject
        if not has_subject_permission(user_id, subject_id, ['COE']):
            return jsonify({'error': 'Unauthorized: Only COE or Administrators can generate question papers.'}), 403

        co_ids = data.get('courseOutcomeIds', [])
        difficulty = data.get('difficulty', 'medium')
        course_specs = data.get('courseSpecifications', '')
        marks_distribution = data.get('marksDistribution', {"short": 5, "long": 3})

        try:
            s_uuid = uuid.UUID(str(subject_id)) if subject_id else None
        except ValueError:
            return jsonify({'error': 'Invalid subjectId format'}), 400

        parsed_co_ids = []
        for cid in co_ids:
            try:
                parsed_co_ids.append(uuid.UUID(str(cid)))
            except ValueError:
                pass

        subject = Subject.query.get(s_uuid)
        if not subject:
            return jsonify({'error': 'Subject not found'}), 404

        cos = CourseOutcome.query.filter(CourseOutcome.id.in_(parsed_co_ids)).all()
        co_list = [f"{co.co_code}: {co.description}" for co in cos]

        # Fetch existing questions to prevent duplication
        existing_questions = Question.query.filter_by(subject_id=s_uuid).all()
        existing_q_texts = []
        for q in existing_questions:
            q_text = extract_text_from_blocks(q.editor_data.get('blocks', []))
            if q_text.strip():
                existing_q_texts.append(q_text.strip())

        existing_questions_block = ""
        if existing_q_texts:
            capped = existing_q_texts[:30]
            numbered = [f"  {i+1}. {t[:200]}" for i, t in enumerate(capped)]
            existing_questions_block = (
                "\n\n=== EXISTING QUESTIONS IN DATABASE (DO NOT REPEAT OR PARAPHRASE THESE) ===\n"
                + "\n".join(numbered)
                + "\n=== END OF EXISTING QUESTIONS ===\n"
            )

        num_short = marks_distribution.get('short', 0)
        num_long = marks_distribution.get('long', 0)

        syllabus_section = ""
        if course_specs.strip():
            syllabus_section = f"""
=== SYLLABUS / COURSE SPECIFICATIONS (MANDATORY CONTEXT) ===
{course_specs.strip()}
=== END OF SYLLABUS ===

CRITICAL: Every question you generate MUST be directly traceable to a topic, concept, 
or learning outcome listed in the syllabus above. Do NOT invent topics outside this scope.
"""

        system_prompt = """You are an expert university examination paper setter with deep subject-matter expertise. 
Your task is to create high-quality, original examination questions that are:
- Factually accurate and academically rigorous
- Directly connected to the provided syllabus and course outcomes
- Proportional in depth and complexity to the marks assigned
- Completely unique — never repeating or paraphrasing existing questions

STRICT RULES:
1. OUTPUT FORMAT: Return strictly VALID JSON only. No markdown, no code fences, no explanations.
2. SYLLABUS ADHERENCE: Every question must test a concept explicitly covered in the syllabus.
3. NO REPETITION: If existing questions are provided, your generated questions must be semantically 
   different — not rephrased, reworded, or restructured versions of them.
4. FACTUAL ACCURACY: Do not generate questions with incorrect premises, made-up terminology, 
   or misleading statements. Each question must be answerable by a student who has studied the syllabus.
5. MARKS-QUALITY ALIGNMENT: The complexity and expected answer length must match the marks:
   - 2-3 marks: Single-concept recall or definition (1-2 sentence answer expected)
   - 5 marks: Conceptual explanation or short comparison (half-page answer expected)
   - 8-10 marks: Analytical question requiring worked examples, diagrams, or multi-step reasoning (1-2 page answer)
   - 12+ marks: Comprehensive question with sub-parts covering multiple concepts (2+ page answer)
6. DIVERSITY AND CO ADHERENCE: Every question must target exactly one of the provided Course Outcomes. If multiple Course Outcomes are listed, spread questions across them. If only one Course Outcome is provided, all questions must target that single outcome. Do NOT generate questions testing concepts outside the provided course outcomes."""

        user_prompt = f"""Generate an examination question paper for the following subject.

SUBJECT: {subject.name}

COURSE OUTCOMES TO ASSESS (MANDATORY CONSTRAINT):
Only generate questions that directly assess the following Course Outcomes. Do not generate questions for any other topics or other course outcomes.
{chr(10).join(f"  - {co}" for co in co_list)}
{syllabus_section}
OVERALL DIFFICULTY LEVEL: {difficulty}

REQUIREMENTS:
- Section A: Exactly {num_short} Short Answer Questions
  * Each question should be answerable in 2-5 sentences
  * Assign marks: 2, 3, or 5 per question (matching question depth)
  * Test recall, definitions, basic understanding, or simple applications
  * Each question must map to one of the provided course outcomes above

- Section B: Exactly {num_long} Long Answer Questions
  * Each question should require detailed explanation, derivation, or analysis
  * Assign marks: 8, 10, or 12 per question (matching question depth)
  * May include sub-parts (a, b, c) for higher-mark questions
  * Test higher-order thinking: analysis, evaluation, design, or comparison
  * Each question must map to one of the provided course outcomes above
{existing_questions_block}
RETURN THIS EXACT JSON STRUCTURE (Include the "coCode" property for each question to specify which Course Outcome it belongs to, using the format e.g. "CO1", "CO2"):
{{
  "sectionA": [
    {{"text": "question text here", "marks": 5, "coCode": "CO1"}},
    ...
  ],
  "sectionB": [
    {{"text": "question text here", "marks": 10, "coCode": "CO2"}},
    ...
  ],
  "totalQuestions": {num_short + num_long}
}}"""

        settings = get_settings()
        provider = get_active_ai_provider(settings)
        generated_text = provider.generate_questions(system_prompt, user_prompt)
        
        result = json.loads(generated_text.strip())

        co_code_to_id = {co.co_code: str(co.id) for co in cos}
        
        for q in result.get('sectionA', []):
            co_code = q.get('coCode')
            if co_code and co_code in co_code_to_id:
                q['courseOutcomeId'] = co_code_to_id[co_code]
            else:
                q['courseOutcomeId'] = co_ids[0] if co_ids else None
                
        for q in result.get('sectionB', []):
            co_code = q.get('coCode')
            if co_code and co_code in co_code_to_id:
                q['courseOutcomeId'] = co_code_to_id[co_code]
            else:
                q['courseOutcomeId'] = co_ids[0] if co_ids else None

        return jsonify(result)

    except Exception as e:
        print(f"AI Generation Error: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/faculty/ai/check-duplicate', methods=['POST'])
@jwt_required()
def check_duplicate():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        subject_id = data.get('subjectId')
        question_text = data.get('questionText', '')
        
        # Verify Contextual Permissions: Admin, Super Admin, or Faculty/Subject Expert for this subject
        if not has_subject_permission(user_id, subject_id, ['FACULTY', 'SUBJECT_EXPERT']):
            return jsonify({'error': 'Unauthorized: Only Faculty or Subject Experts assigned to this subject can run duplicate checks.'}), 403

        if not subject_id or not question_text:
            return jsonify({'error': 'Missing required fields'}), 400

        try:
             s_uuid = uuid.UUID(str(subject_id))
        except ValueError:
             return jsonify({'error': 'Invalid subjectId format'}), 400

        existing_questions = Question.query.filter_by(subject_id=s_uuid).all()
        
        db_entries = []
        for q in existing_questions:
            q_text = extract_text_from_blocks(q.editor_data.get('blocks', []))
            if q_text.strip():
                db_entries.append({"id": str(q.id), "text": q_text})

        if not db_entries:
             return jsonify({
                'isDuplicate': False,
                'similarQuestions': [],
                'similarityScore': 0.0
            })

        settings = get_settings()
        provider = get_active_ai_provider(settings)

        sliced_db_entries = db_entries[-20:]
        sliced_texts = [e['text'] for e in sliced_db_entries]

        # Retrieve embeddings via service abstraction layer
        all_texts = [question_text] + sliced_texts
        embeddings = provider.get_embeddings(all_texts)

        target_emb = embeddings[0]
        db_embeddings_raw = embeddings[1:]

        max_score = 0.0
        similar_ids = []
        
        v1 = target_emb
        for i, emb_data in enumerate(db_embeddings_raw):
             v2 = emb_data
             
             if isinstance(v1, list) and len(v1) == 1 and isinstance(v1[0], list): v1 = v1[0]
             if isinstance(v2, list) and len(v2) == 1 and isinstance(v2[0], list): v2 = v2[0]

             if len(v1) != len(v2):
                 continue

             score = cosine_similarity(v1, v2)
             
             if score > max_score:
                 max_score = score
             
             if score > 0.80:
                 preview = sliced_db_entries[i]['text'][:50] + "..."
                 similar_ids.append(f"QID: {sliced_db_entries[i]['id']} ({int(score*100)}%) - {preview}")

        return jsonify({
            "isDuplicate": bool(max_score > 0.80),
            "similarityScore": float(f"{max_score:.2f}"),
            "similarQuestions": similar_ids
        })

    except Exception as e:
        print(f"Duplicate Check Error: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/api/ai/generate-question', methods=['POST'])
@jwt_required()
def generate_single_question():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        subject_id = data.get('subjectId')
        
        # Verify Contextual Permissions: Admin, Super Admin, or Faculty/Subject Expert for this subject
        if not has_subject_permission(user_id, subject_id, ['FACULTY', 'SUBJECT_EXPERT']):
            return jsonify({'error': 'Unauthorized: Only Faculty or Subject Experts assigned to this subject can generate questions.'}), 403

        topic = data.get('topic')
        difficulty = data.get('difficulty', 'MEDIUM').upper()
        marks = data.get('marks', 5)

        if difficulty not in ['EASY', 'MEDIUM', 'HARD']:
            return jsonify({'error': 'Invalid difficulty level. Must be EASY, MEDIUM, or HARD.'}), 400

        if not subject_id or not topic:
            return jsonify({'error': 'Missing subjectId or topic field.'}), 400

        try:
            s_uuid = uuid.UUID(str(subject_id))
        except ValueError:
            return jsonify({'error': 'Invalid subjectId format'}), 400
            
        subject = Subject.query.get(s_uuid)
        if not subject:
            return jsonify({'error': 'Subject not found'}), 404

        existing_questions = Question.query.filter_by(subject_id=subject_id).all()
        existing_q_texts = []
        for q in existing_questions:
            q_text = extract_text_from_blocks(q.editor_data.get('blocks', []))
            if q_text.strip():
                existing_q_texts.append(q_text.strip())

        existing_block = ""
        if existing_q_texts:
            capped = existing_q_texts[:20]
            numbered = [f"  {i+1}. {t[:150]}" for i, t in enumerate(capped)]
            existing_block = (
                "\n\nEXISTING QUESTIONS (DO NOT repeat, rephrase, or paraphrase any of these):\n"
                + "\n".join(numbered) + "\n"
            )

        if marks <= 3:
            depth_guide = "This is a low-mark question. Expect a 1-2 sentence answer. Test a single concept, definition, or factual recall."
        elif marks <= 5:
            depth_guide = "This is a mid-mark question. Expect a half-page answer. Test conceptual understanding, comparison, or a short explanation with an example."
        elif marks <= 10:
            depth_guide = "This is a high-mark question. Expect a 1-2 page answer. Test analytical thinking, worked examples, derivations, or multi-step reasoning."
        else:
            depth_guide = "This is a comprehensive question. Expect a 2+ page answer. Include sub-parts (a, b, c) covering multiple related concepts."

        system_prompt = """You are an expert university examination question setter. 
Generate factually accurate, academically rigorous questions that are:
- Directly relevant to the specified topic and subject
- Proportional in depth and complexity to the assigned marks
- Original and not a rephrasing of any existing question provided
Return strictly VALID JSON only. No markdown, no code fences, no explanations."""

        user_prompt = f"""Create ONE examination question.

Subject: {subject.name}
Topic: {topic}
Difficulty: {difficulty}
Marks: {marks}

QUALITY GUIDELINE: {depth_guide}
{existing_block}
Return exactly this JSON: {{ "text": "Your question here" }}"""

        settings = get_settings()
        provider = get_active_ai_provider(settings)
        generated_text = provider.generate_questions(system_prompt, user_prompt)
        
        clean_text = generated_text
        if '```json' in clean_text:
            clean_text = clean_text.split('```json')[1].split('```')[0]
        elif '```' in clean_text:
            clean_text = clean_text.split('```')[1].split('```')[0]
            
        try:
            json_data = json.loads(clean_text)
            q_text = json_data.get('text', clean_text)
        except json.JSONDecodeError:
            q_text = clean_text

        # Dynamic taxonomy estimations using service layers
        computed_bloom = provider.classify_bloom_level(q_text)
        computed_difficulty = provider.estimate_difficulty(q_text)

        new_q = Question(
            subject_id=subject.id,
            editor_data={
                "time": int(time.time()),
                "blocks": [{"type": "paragraph", "data": {"text": q_text}}],
                "marks": marks,
                "meta": {
                    "bloomLevel": computed_bloom,
                    "difficulty": computed_difficulty
                }
            },
            creator_id=user_id,
            source="AI",
            difficulty=computed_difficulty,
            bloom_level=computed_bloom,
            status="DRAFT" # Starts as draft
        )
        db.session.add(new_q)
        db.session.flush()

        log_entry = AILog(
            admin_user_id=user_id,
            question_id=new_q.id,
            input_prompt=user_prompt,
            generated_text=generated_text
        )
        db.session.add(log_entry)
        
        db.session.commit()
        return jsonify({"message": "Successfully generated and logged AI Question", "question": new_q.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Generate AI Question Error: {e}")
        return jsonify({'error': str(e)}), 500
