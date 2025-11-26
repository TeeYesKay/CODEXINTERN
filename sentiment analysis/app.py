from flask import Flask, render_template, request, jsonify
from textblob import TextBlob
import re

app = Flask(__name__)

def normalize_text(text):
    """
    Normalize text by reducing excessive letter repetitions.
    For example: 'sooooo' -> 'so', 'happyyyy' -> 'happy'
    This helps sentiment analysis treat overly enthusiastic text the same as normal text.
    Preserves legitimate double letters in words like 'book', 'see', 'happy'.
    """
    # Replace sequences of 3+ repeated letters (excessive) with just 1 letter
    # Pattern: (.)\1{2,} matches any character followed by 2+ of the same (3+ total)
    # This preserves double letters in normal words but normalizes excessive repetition
    normalized = re.sub(r'(.)\1{2,}', r'\1', text)
    return normalized

def classify_sentiment(polarity):
    """Classify sentiment based on polarity score"""
    if polarity > 0.1:
        return "positive"
    elif polarity < -0.1:
        return "negative"
    else:
        return "neutral"

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze sentiment of the provided text"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({
                'error': 'Please enter some text to analyze'
            }), 400
        
        # Normalize text to handle excessive letter repetitions
        # (e.g., "sooooo" -> "sooo", "happyyyy" -> "happyy")
        normalized_text = normalize_text(text)
        
        # Perform sentiment analysis using TextBlob on normalized text
        blob = TextBlob(normalized_text)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        
        # Classify sentiment
        sentiment = classify_sentiment(polarity)
        
        return jsonify({
            'sentiment': sentiment,
            'polarity': round(polarity, 3),
            'subjectivity': round(subjectivity, 3),
            'text': text
        })
    
    except Exception as e:
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True)

