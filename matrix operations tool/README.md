# Matrix Operations Tool

A web-based Matrix Operations Tool built with Python (Flask + NumPy) and an interactive HTML/CSS/JavaScript frontend.

## Features

- **Matrix Addition**: Add two matrices of the same dimensions
- **Matrix Subtraction**: Subtract two matrices of the same dimensions
- **Matrix Multiplication**: Multiply two compatible matrices
- **Matrix Transpose**: Transpose any matrix
- **Determinant Calculation**: Calculate the determinant of square matrices

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the Flask server:
```bash
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

3. Use the interface to:
   - Set matrix dimensions (1-10 rows/columns)
   - Input matrix values
   - Select and perform operations
   - View results in a structured format

## Technologies Used

- **Backend**: Python, Flask, NumPy
- **Frontend**: HTML5, CSS3, JavaScript
- **API**: RESTful API endpoints for each operation

## API Endpoints

- `POST /api/add` - Matrix addition
- `POST /api/subtract` - Matrix subtraction
- `POST /api/multiply` - Matrix multiplication
- `POST /api/transpose` - Matrix transpose
- `POST /api/determinant` - Determinant calculation

