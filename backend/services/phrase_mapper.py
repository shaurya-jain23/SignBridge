"""
Phrase Mapper Utility

This module provides a unified dictionary and helper function to format
raw ML model gesture labels (e.g. "iloveyou", "thanks", "a", "b") into
clean, conversational English strings for the frontend UI.
"""

from typing import Optional

# Dictionary mapping raw model labels to conversational phrases
PHRASE_DICTIONARY = {
    # Dynamic LSTM Phrases
    "hello": "Hello!",
    "thanks": "Thank you!",
    "iloveyou": "I love you!",
    "sad": "I'm feeling sad.",
    "happy": "I am so happy!",
    "please": "Please.",
    "yes": "Yes.",
    "no": "No.",
    "sorry": "I'm sorry.",
    
    # Common ISL Static Words (if any full words are trained)
    "good": "Good!",
    "bad": "Bad.",
    "name": "My name is...",
    
    # Static Alphabets stay uppercase
    **{chr(i): chr(i).upper() for i in range(ord('a'), ord('z') + 1)}
}

def format_gesture_label(raw_label: str) -> str:
    """
    Takes a raw, lowercase label from the gesture classifier and returns
    a formatted, human-readable string. If no exact mapping exists,
    it capitalizes the first letter as a fallback.
    """
    if not raw_label:
        return ""
        
    cleaned_label = str(raw_label).strip().lower()
    
    # Look up in dictionary, fallback to Title Case if not found
    return PHRASE_DICTIONARY.get(cleaned_label, cleaned_label.title())

def format_sentence(words: list[str]) -> str:
    """
    Takes a list of formatted words/letters and joins them into a sentence,
    handling spaces logically.
    """
    if not words:
        return ""
        
    sentence = " ".join(words)
    
    # Basic cleanup: remove extra spaces before punctuation
    sentence = sentence.replace(" !", "!")
    sentence = sentence.replace(" .", ".")
    sentence = sentence.replace(" ?", "?")
    sentence = sentence.replace(" ,", ",")
    
    return sentence
