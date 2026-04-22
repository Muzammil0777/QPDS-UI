import re
import string

BLOOM_KEYWORDS = {
    "remember": [
        "define", "list", "recall", "identify", "name", "state",
        "recognize", "label", "select", "match", "memorize",
        "repeat", "outline", "who", "what", "when", "where"
    ],
    "understand": [
        "explain", "summarize", "describe", "interpret", "classify",
        "discuss", "outline", "paraphrase", "illustrate",
        "compare", "contrast", "differentiate", "distinguish",
        "give examples", "rewrite", "infer"
    ],
    "apply": [
        "apply", "use", "solve", "implement", "demonstrate",
        "execute", "calculate", "show", "modify", "operate",
        "perform", "practice", "compute", "illustrate",
        "simulate"
    ],
    "analyze": [
        "analyze", "differentiate", "compare", "contrast",
        "examine", "categorize", "distinguish", "break down",
        "infer", "test", "investigate", "relate",
        "organize", "attribute", "structure"
    ],
    "evaluate": [
        "evaluate", "justify", "critique", "defend", "argue",
        "assess", "validate", "judge", "recommend",
        "prioritize", "verify", "decide", "rate",
        "measure", "conclude"
    ],
    "create": [
        "design", "develop", "construct", "formulate",
        "generate", "plan", "compose", "create",
        "build", "invent", "propose", "produce",
        "derive", "assemble", "synthesize"
    ]
}

# Define cognitive levels priority for tie-breaking
BLOOM_PRIORITY = {
    "remember": 1,
    "understand": 2,
    "apply": 3,
    "analyze": 4,
    "evaluate": 5,
    "create": 6
}

def normalize_text(text):
    """Convert to lowercase and remove punctuation."""
    if not text:
        return ""
    text = text.lower()
    # Remove punctuation using string translation
    translator = str.maketrans('', '', string.punctuation)
    text = text.translate(translator)
    # Remove extra whitespaces
    return " ".join(text.split())

def classify_bloom_level(question_text):
    """
    Classify the given question text into a Bloom's Taxonomy level.
    """
    if not question_text:
        return "understand"
        
    normalized = normalize_text(question_text)
    scores = {level: 0 for level in BLOOM_KEYWORDS}
    
    # Check for keywords using substring matching (with word boundaries)
    for level, keywords in BLOOM_KEYWORDS.items():
        for kw in keywords:
            # We want to match whole words or phrases (e.g. "give examples")
            # Using regex with \b (word boundary) ensures we don't match substrings inside other words
            pattern = r'\b' + re.escape(kw) + r'\b'
            matches = re.findall(pattern, normalized)
            scores[level] += len(matches)
            
    # Find the maximum score
    max_score = max(scores.values())
    
    # If no keywords matched, default to understand
    if max_score == 0:
        return "understand"
        
    # Find all levels with the maximum score
    top_levels = [level for level, score in scores.items() if score == max_score]
    
    # Resolve ties by choosing the higher cognitive level
    top_levels.sort(key=lambda x: BLOOM_PRIORITY[x], reverse=True)
    
    return top_levels[0]

def map_to_difficulty(level):
    """
    Map Bloom's taxonomy level to difficulty rating.
    """
    mapping = {
        "remember": "EASY",
        "understand": "EASY",
        "apply": "MEDIUM",
        "analyze": "MEDIUM",
        "evaluate": "HARD",
        "create": "HARD"
    }
    return mapping.get(level, "MEDIUM")

def extract_text_from_editor_data(editor_data):
    """
    Safely extract plain text from Editor.js data object.
    """
    if not editor_data or not isinstance(editor_data, dict):
        return ""
    
    blocks = editor_data.get("blocks", [])
    text_parts = []
    
    for block in blocks:
        block_data = block.get("data", {})
        text = block_data.get("text", "")
        if text:
            # Optionally remove HTML tags if the text contains any (like <b>, <i>)
            # but for simple keyword matching, just keeping it raw is fine 
            # since normalize_text removes punctuation. 
            # However, HTML tags like <b> might get glued. Let's do a simple strip.
            clean_text = re.sub(r'<[^>]+>', ' ', text)
            text_parts.append(clean_text)
            
    return " ".join(text_parts)
