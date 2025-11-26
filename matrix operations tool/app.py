from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/add', methods=['POST'])
def add_matrices():
    try:
        data = request.json
        matrix1 = np.array(data['matrix1'])
        matrix2 = np.array(data['matrix2'])
        
        if matrix1.shape != matrix2.shape:
            return jsonify({'error': 'Matrices must have the same dimensions for addition'}), 400
        
        result = matrix1 + matrix2
        return jsonify({
            'success': True,
            'result': result.tolist(),
            'shape': result.shape
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/subtract', methods=['POST'])
def subtract_matrices():
    try:
        data = request.json
        matrix1 = np.array(data['matrix1'])
        matrix2 = np.array(data['matrix2'])
        
        if matrix1.shape != matrix2.shape:
            return jsonify({'error': 'Matrices must have the same dimensions for subtraction'}), 400
        
        result = matrix1 - matrix2
        return jsonify({
            'success': True,
            'result': result.tolist(),
            'shape': result.shape
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/multiply', methods=['POST'])
def multiply_matrices():
    try:
        data = request.json
        matrix1 = np.array(data['matrix1'])
        matrix2 = np.array(data['matrix2'])
        
        if matrix1.shape[1] != matrix2.shape[0]:
            return jsonify({'error': f'Matrix dimensions incompatible for multiplication. Matrix1 columns ({matrix1.shape[1]}) must equal Matrix2 rows ({matrix2.shape[0]})'}), 400
        
        result = np.dot(matrix1, matrix2)
        return jsonify({
            'success': True,
            'result': result.tolist(),
            'shape': result.shape
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/transpose', methods=['POST'])
def transpose_matrix():
    try:
        data = request.json
        matrix = np.array(data['matrix'])
        result = matrix.T
        return jsonify({
            'success': True,
            'result': result.tolist(),
            'shape': result.shape
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/determinant', methods=['POST'])
def calculate_determinant():
    try:
        data = request.json
        matrix = np.array(data['matrix'])
        
        if matrix.shape[0] != matrix.shape[1]:
            return jsonify({'error': 'Matrix must be square (same number of rows and columns) to calculate determinant'}), 400
        
        det = np.linalg.det(matrix)
        return jsonify({
            'success': True,
            'result': float(det)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)

