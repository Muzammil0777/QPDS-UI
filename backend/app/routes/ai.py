
import os
import json
import math
import time
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from huggingface_hub import InferenceClient
from ..models import db, Question, Subject, CourseOutcome

bp = Blueprint('ai', __name__)

def get_hf_client(model_id):
    api_key = os.getenv('HF_API_KEY')
    if not api_key:
        raise ValueError("HF_API_KEY not found in environment variables")
    return InferenceClient(model=model_id, token=api_key)

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
        data = request.get_json()
        subject_id = data.get('subjectId')
        co_ids = data.get('courseOutcomeIds', [])
        difficulty = data.get('difficulty', 'medium')
        course_specs = data.get('courseSpecifications', '')
        marks_distribution = data.get('marksDistribution', {"short": 5, "long": 3})

        subject = Subject.query.get(subject_id)
        if not subject:
            return jsonify({'error': 'Subject not found'}), 404

        cos = CourseOutcome.query.filter(CourseOutcome.id.in_(co_ids)).all()
        co_list = [f"{co.co_code}: {co.description}" for co in cos]

        # ── Fetch existing questions from DB to prevent duplication ──
        existing_questions = Question.query.filter_by(subject_id=subject_id).all()
        existing_q_texts = []
        for q in existing_questions:
            q_text = extract_text_from_blocks(q.editor_data.get('blocks', []))
            if q_text.strip():
                existing_q_texts.append(q_text.strip())

        # Build a concise list of existing questions (cap at 30 to stay within token limits)
        existing_questions_block = ""
        if existing_q_texts:
            capped = existing_q_texts[:30]
            numbered = [f"  {i+1}. {t[:200]}" for i, t in enumerate(capped)]
            existing_questions_block = (
                "\n\n=== EXISTING QUESTIONS IN DATABASE (DO NOT REPEAT OR PARAPHRASE THESE) ===\n"
                + "\n".join(numbered)
                + "\n=== END OF EXISTING QUESTIONS ===\n"
            )

        model_id = os.getenv('HF_MODEL_QP', 'Qwen/Qwen2.5-7B-Instruct')
        client = get_hf_client(model_id)

        num_short = marks_distribution.get('short', 0)
        num_long = marks_distribution.get('long', 0)

        # ── Build syllabus context ──
        syllabus_section = ""
        if course_specs.strip():
            syllabus_section = f"""
=== SYLLABUS / COURSE SPECIFICATIONS (MANDATORY CONTEXT) ===
{course_specs.strip()}
=== END OF SYLLABUS ===

CRITICAL: Every question you generate MUST be directly traceable to a topic, concept, 
or learning outcome listed in the syllabus above. Do NOT invent topics outside this scope.
"""

        # ── Improved system prompt ──
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
6. DIVERSITY: Spread questions across different course outcomes and syllabus topics. 
   Do not cluster multiple questions on the same narrow sub-topic."""

        # ── Improved user prompt ──
        user_prompt = f"""Generate an examination question paper for the following subject.

SUBJECT: {subject.name}

COURSE OUTCOMES TO ASSESS:
{chr(10).join(f"  - {co}" for co in co_list)}
{syllabus_section}
OVERALL DIFFICULTY LEVEL: {difficulty}

REQUIREMENTS:
- Section A: Exactly {num_short} Short Answer Questions
  * Each question should be answerable in 2-5 sentences
  * Assign marks: 2, 3, or 5 per question (matching question depth)
  * Test recall, definitions, basic understanding, or simple applications
  * Each question should target a DIFFERENT topic from the syllabus

- Section B: Exactly {num_long} Long Answer Questions
  * Each question should require detailed explanation, derivation, or analysis
  * Assign marks: 8, 10, or 12 per question (matching question depth)
  * May include sub-parts (a, b, c) for higher-mark questions
  * Test higher-order thinking: analysis, evaluation, design, or comparison
  * Each question should cover a DIFFERENT major topic area
{existing_questions_block}
RETURN THIS EXACT JSON STRUCTURE:
{{
  "sectionA": [{{"text": "question text here", "marks": 5}}, ...],
  "sectionB": [{{"text": "question text here", "marks": 10}}, ...],
  "totalQuestions": {num_short + num_long}
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # Use slightly lower temperature for more focused, factual output
        output = client.chat_completion(messages=messages, max_tokens=2500, temperature=0.5)
        generated_text = output.choices[0].message.content.strip()

        # Cleanup JSON
        if '```json' in generated_text:
            generated_text = generated_text.split('```json')[1].split('```')[0]
        elif '```' in generated_text:
             generated_text = generated_text.split('```')[1].split('```')[0]
             
        result = json.loads(generated_text.strip())
        return jsonify(result)

    except Exception as e:
        print(f"AI Generation Error: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/faculty/ai/check-duplicate', methods=['POST'])
@jwt_required()
def check_duplicate():
    try:
        data = request.get_json()
        subject_id = data.get('subjectId')
        question_text = data.get('questionText', '')
        
        if not subject_id or not question_text:
            return jsonify({'error': 'Missing required fields'}), 400

        import uuid
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

        model_id = os.getenv('HF_MODEL_DUP', 'sentence-transformers/all-MiniLM-L6-v2')
        client = get_hf_client(model_id)
        
        # 1. Get embedding for new question
        # feature_extraction returns ndarray or list
        try:
             target_emb = client.feature_extraction(question_text)
        except Exception as e:
             # Retry once
             time.sleep(1)
             target_emb = client.feature_extraction(question_text)
             
        # 2. Get embeddings for DB entries
        # Batching logic: client.feature_extraction handles lists usually?
        # Let's try batching in small chunks to be safe or one by one if list fails
        # Verified: InferenceClient.feature_extraction accepts string only in strict typing signature?
        # Actually it accepts list[str] too usually. Let's try one by one to avoid issues if batch fails.
        # But that's slow. Let's try list.
        
        db_texts = [e['text'] for e in db_entries]
        
        # Limitation: Sending too many texts might hit payload limits.
        # For prototype, assume < 20 texts. If more, slice.
        # Let's slice to last 20 explicitly to avoid timeout
        
        sliced_db_entries = db_entries[-20:]
        sliced_text = [e['text'] for e in sliced_db_entries]
        
        if sliced_text:
            db_embeddings_raw = client.feature_extraction(sliced_text)
            # If shape is (n_samples, n_features), good.
            # db_embeddings_raw is likely a numpy array or list of lists
        else:
            db_embeddings_raw = []

        max_score = 0.0
        similar_ids = []
        
        # Iterate and compare
        # Target emb is (1, 384) or (384,)
        # db_embeddings is (N, 384)
        
        # Normalize target structure
        if len(target_emb) == 1 and isinstance(target_emb[0], list): 
             v1 = target_emb[0] # Handle [[...]]
        else:
             v1 = target_emb
             
        for i, emb_data in enumerate(db_embeddings_raw):
             v2 = emb_data
             
             # Flatten if nested
             if isinstance(v1, list) and len(v1) == 1 and isinstance(v1[0], list): v1 = v1[0]
             if isinstance(v2, list) and len(v2) == 1 and isinstance(v2[0], list): v2 = v2[0]

             if len(v1) != len(v2):
                 continue # Skip dimension mismatch

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
        from ..models import User, AILog
        from ..services.bloom_service import classify_bloom_level, map_to_difficulty
        user = User.query.get(user_id)
        
        # 1. Protect & Restrict Endpoint
        if not user or user.role != 'ADMIN':
            return jsonify({'error': 'Unauthorized access. Only Admin can generate AI questions.'}), 403

        data = request.get_json()
        subject_id = data.get('subjectId')
        topic = data.get('topic')
        difficulty = data.get('difficulty', 'MEDIUM').upper()
        marks = data.get('marks', 5)

        # 2. Validation
        if difficulty not in ['EASY', 'MEDIUM', 'HARD']:
            return jsonify({'error': 'Invalid difficulty level. Must be EASY, MEDIUM, or HARD.'}), 400

        if not subject_id or not topic:
            return jsonify({'error': 'Missing subjectId or topic field.'}), 400

        subject = Subject.query.get(subject_id)
        if not subject:
            return jsonify({'error': 'Subject not found'}), 404

        # ── Fetch existing questions on this topic to avoid repetition ──
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

        # ── Marks-to-depth guidance ──
        if marks <= 3:
            depth_guide = "This is a low-mark question. Expect a 1-2 sentence answer. Test a single concept, definition, or factual recall."
        elif marks <= 5:
            depth_guide = "This is a mid-mark question. Expect a half-page answer. Test conceptual understanding, comparison, or a short explanation with an example."
        elif marks <= 10:
            depth_guide = "This is a high-mark question. Expect a 1-2 page answer. Test analytical thinking, worked examples, derivations, or multi-step reasoning."
        else:
            depth_guide = "This is a comprehensive question. Expect a 2+ page answer. Include sub-parts (a, b, c) covering multiple related concepts."

        model_id = os.getenv('HF_MODEL_QP', 'Qwen/Qwen2.5-7B-Instruct')
        client = get_hf_client(model_id)

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

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # Call AI
        output = client.chat_completion(messages=messages, max_tokens=800, temperature=0.5)
        generated_text = output.choices[0].message.content.strip()
        
        # Safely parse text
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

        # Auto-classify Bloom's level and difficulty from the generated text
        computed_bloom = classify_bloom_level(q_text)
        computed_difficulty = map_to_difficulty(computed_bloom)

        # 3. Prevent Spoofing - Strict assignments
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
            creator_id=user.id,
            source="AI",
            difficulty=computed_difficulty,
            bloom_level=computed_bloom
        )
        db.session.add(new_q)
        db.session.flush()

        # 4. Enforce Event Tracking
        log_entry = AILog(
            admin_user_id=user.id,
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

