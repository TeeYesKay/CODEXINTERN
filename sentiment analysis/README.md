# Sentiment Analysis Web Application

A Flask-based web application that performs sentiment analysis on user-entered text using TextBlob. The application classifies text as positive, negative, or neutral and displays polarity and subjectivity scores.

## Features

- **Sentiment Classification**: Automatically classifies text as positive, negative, or neutral
- **Polarity Score**: Displays sentiment polarity ranging from -1 (negative) to +1 (positive)
- **Subjectivity Score**: Shows how subjective (0) or objective (1) the text is
- **Modern UI**: Beautiful, responsive web interface with gradient design
- **Real-time Analysis**: Instant sentiment analysis results

## Installation

1. **Clone or navigate to the project directory**

2. **Create a virtual environment (recommended)**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Download TextBlob corpora (required for first run)**
   ```bash
   python -m textblob.download_corpora
   ```

## Usage

1. **Run the Flask application**
   ```bash
   python app.py
   ```

2. **Open your web browser** and navigate to:
   ```
   http://localhost:5000
   ```

3. **Enter text** in the text area and click "Analyze Sentiment" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

4. **View results** including:
   - Sentiment classification (positive/negative/neutral)
   - Polarity score (-1 to +1)
   - Subjectivity score (0 to 1)

## How It Works

- **Polarity**: Measures the sentiment of the text
  - Values > 0.1: Positive sentiment
  - Values < -0.1: Negative sentiment
  - Values between -0.1 and 0.1: Neutral sentiment

- **Subjectivity**: Measures how opinionated the text is
  - Values closer to 0: More objective/factual
  - Values closer to 1: More subjective/opinionated

## Technologies Used

- **Flask**: Web framework for Python
- **TextBlob**: Natural language processing library for sentiment analysis
- **HTML/CSS/JavaScript**: Frontend interface
- **JavaScript Fetch API**: For AJAX requests

## Project Structure

```
anchat/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
└── templates/
    └── index.html        # Main HTML template
```

## Notes

- The application runs in debug mode by default. For production, set `debug=False` in `app.py`
- TextBlob requires internet connection on first run to download corpora
- The sentiment analysis is based on pattern analysis and may not always be 100% accurate

