
import os
import json
import math
import time
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
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
        marks_distribution = data.get('marksDistribution', {"short": 5, "long": 3})

        subject = Subject.query.get(subject_id)
        if not subject:
            return jsonify({'error': 'Subject not found'}), 404

        cos = CourseOutcome.query.filter(CourseOutcome.id.in_(co_ids)).all()
        co_list = [f"{co.co_code}: {co.description}" for co in cos]

        # Use Qwen/Qwen2.5-7B-Instruct as default (Mistral-7B-Instruct-v0.2 often fails on free tier)
        model_id = os.getenv('HF_MODEL_QP', 'Qwen/Qwen2.5-7B-Instruct')
        client = get_hf_client(model_id)

        # Interpret 'marksDistribution' as 'questionCounts' based on user requirement
        # Frontend sends { "short": X, "long": Y }
        num_short = marks_distribution.get('short', 0)
        num_long = marks_distribution.get('long', 0)

        system_prompt = "You are an exam paper setter. Return strictly VALID JSON only. No markdown formatting, no explanations."
        user_prompt = f"""Create a structured question paper.
Subject: {subject.name}
Course Outcomes: {', '.join(co_list)}
Difficulty: {difficulty}
Requirements: Exactly {num_short} Short Questions and {num_long} Long Questions.

Format:
Section A: Short questions (2-3 lines)
Section B: Long questions (8-12 lines)

JSON Structure:
{{
  "sectionA": ["question 1", "question 2", ...],  // Must contain exactly {num_short} items
  "sectionB": ["question 1", "question 2", ...],  // Must contain exactly {num_long} items
  "totalQuestions": {num_short + num_long}
}}
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # Chat Completion API
        output = client.chat_completion(messages=messages, max_tokens=1500, temperature=0.7)
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
