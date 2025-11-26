from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
import os
from werkzeug.utils import secure_filename
import numpy as np

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_visualization(fig):
    """Convert matplotlib figure to base64 string"""
    img = io.BytesIO()
    fig.savefig(img, format='png', bbox_inches='tight', dpi=100)
    img.seek(0)
    plot_url = base64.b64encode(img.getvalue()).decode()
    plt.close(fig)
    return plot_url

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Load CSV
            df = pd.read_csv(filepath)
            
            # Basic info
            info = {
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': df.columns.tolist(),
                'data_types': df.dtypes.astype(str).to_dict(),
                'missing_values': df.isnull().sum().to_dict(),
                'sample_data': df.head(10).to_dict('records')
            }
            
            return jsonify({
                'success': True,
                'filename': filename,
                'info': info
            })
        except Exception as e:
            return jsonify({'error': f'Error reading CSV: {str(e)}'}), 400
    
    return jsonify({'error': 'Invalid file type. Please upload a CSV file.'}), 400

@app.route('/analyze', methods=['POST'])
def analyze_data():
    data = request.json
    filename = data.get('filename')
    selected_column = data.get('column')
    
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    try:
        df = pd.read_csv(filepath)
        
        if selected_column not in df.columns:
            return jsonify({'error': 'Column not found'}), 400
        
        # Calculate statistics
        column_data = df[selected_column]
        
        # Check if numeric
        if pd.api.types.is_numeric_dtype(column_data):
            stats = {
                'mean': float(column_data.mean()),
                'median': float(column_data.median()),
                'std': float(column_data.std()),
                'min': float(column_data.min()),
                'max': float(column_data.max()),
                'count': int(column_data.count()),
                'is_numeric': True
            }
        else:
            stats = {
                'count': int(column_data.count()),
                'unique': int(column_data.nunique()),
                'most_frequent': column_data.mode().iloc[0] if len(column_data.mode()) > 0 else None,
                'is_numeric': False
            }
        
        return jsonify({
            'success': True,
            'column': selected_column,
            'statistics': stats
        })
    except Exception as e:
        return jsonify({'error': f'Error analyzing data: {str(e)}'}), 400

@app.route('/visualize', methods=['POST'])
def create_visualizations():
    data = request.json
    filename = data.get('filename')
    viz_type = data.get('type')
    
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    try:
        df = pd.read_csv(filepath)
        
        # Set style
        plt.style.use('seaborn-v0_8-darkgrid')
        sns.set_palette("husl")
        
        if viz_type == 'bar':
            column = data.get('column')
            if not column or column not in df.columns:
                return jsonify({'error': 'Invalid column for bar chart'}), 400
            
            fig, ax = plt.subplots(figsize=(10, 6))
            value_counts = df[column].value_counts().head(10)
            value_counts.plot(kind='bar', ax=ax, color='steelblue', edgecolor='black')
            ax.set_title(f'Bar Chart: {column}', fontsize=16, fontweight='bold', pad=20)
            ax.set_xlabel(column, fontsize=12)
            ax.set_ylabel('Frequency', fontsize=12)
            ax.tick_params(axis='x', rotation=45)
            plt.tight_layout()
            
            plot_url = create_visualization(fig)
            return jsonify({'success': True, 'plot': plot_url, 'type': 'bar'})
        
        elif viz_type == 'scatter':
            x_col = data.get('x_column')
            y_col = data.get('y_column')
            
            if not x_col or not y_col or x_col not in df.columns or y_col not in df.columns:
                return jsonify({'error': 'Invalid columns for scatter plot'}), 400
            
            # Check if columns are numeric
            if not pd.api.types.is_numeric_dtype(df[x_col]) or not pd.api.types.is_numeric_dtype(df[y_col]):
                return jsonify({'error': 'Both columns must be numeric for scatter plot'}), 400
            
            fig, ax = plt.subplots(figsize=(10, 6))
            ax.scatter(df[x_col], df[y_col], alpha=0.6, s=50, color='coral', edgecolors='black', linewidth=0.5)
            ax.set_title(f'Scatter Plot: {x_col} vs {y_col}', fontsize=16, fontweight='bold', pad=20)
            ax.set_xlabel(x_col, fontsize=12)
            ax.set_ylabel(y_col, fontsize=12)
            ax.grid(True, alpha=0.3)
            plt.tight_layout()
            
            plot_url = create_visualization(fig)
            return jsonify({'success': True, 'plot': plot_url, 'type': 'scatter'})
        
        elif viz_type == 'heatmap':
            # Select only numeric columns for heatmap
            numeric_df = df.select_dtypes(include=[np.number])
            
            if len(numeric_df.columns) < 2:
                return jsonify({'error': 'Need at least 2 numeric columns for heatmap'}), 400
            
            fig, ax = plt.subplots(figsize=(12, 8))
            correlation_matrix = numeric_df.corr()
            sns.heatmap(correlation_matrix, annot=True, fmt='.2f', cmap='coolwarm', 
                       center=0, square=True, linewidths=1, cbar_kws={"shrink": 0.8}, ax=ax)
            ax.set_title('Correlation Heatmap', fontsize=16, fontweight='bold', pad=20)
            plt.tight_layout()
            
            plot_url = create_visualization(fig)
            return jsonify({'success': True, 'plot': plot_url, 'type': 'heatmap'})
        
        else:
            return jsonify({'error': 'Invalid visualization type'}), 400
            
    except Exception as e:
        return jsonify({'error': f'Error creating visualization: {str(e)}'}), 400

@app.route('/insights', methods=['POST'])
def get_insights():
    data = request.json
    filename = data.get('filename')
    
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    try:
        df = pd.read_csv(filepath)
        insights = []
        
        # General insights
        insights.append(f"Dataset contains {len(df)} rows and {len(df.columns)} columns.")
        
        # Missing values insight
        missing = df.isnull().sum()
        if missing.sum() > 0:
            insights.append(f"Missing values detected: {missing[missing > 0].to_dict()}")
        else:
            insights.append("No missing values found in the dataset.")
        
        # Numeric columns insights
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            insights.append(f"Numeric columns: {', '.join(numeric_cols.tolist())}")
            for col in numeric_cols[:3]:  # Top 3 numeric columns
                insights.append(f"{col}: Mean = {df[col].mean():.2f}, Std = {df[col].std():.2f}")
        
        # Categorical columns insights
        categorical_cols = df.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            insights.append(f"Categorical columns: {', '.join(categorical_cols.tolist())}")
            for col in categorical_cols[:2]:  # Top 2 categorical columns
                top_value = df[col].value_counts().head(1)
                if len(top_value) > 0:
                    insights.append(f"{col}: Most frequent value is '{top_value.index[0]}' ({top_value.iloc[0]} occurrences)")
        
        # Correlation insights
        if len(numeric_cols) >= 2:
            corr_matrix = df[numeric_cols].corr()
            # Find highest correlation (excluding self-correlation)
            max_corr = -1
            max_pair = None
            for i in range(len(corr_matrix.columns)):
                for j in range(i+1, len(corr_matrix.columns)):
                    corr_val = abs(corr_matrix.iloc[i, j])
                    if corr_val > max_corr:
                        max_corr = corr_val
                        max_pair = (corr_matrix.columns[i], corr_matrix.columns[j])
            
            if max_pair:
                actual_corr = corr_matrix.loc[max_pair[0], max_pair[1]]
                insights.append(f"Strongest correlation: {max_pair[0]} and {max_pair[1]} ({actual_corr:.3f})")
        
        return jsonify({
            'success': True,
            'insights': insights
        })
    except Exception as e:
        return jsonify({'error': f'Error generating insights: {str(e)}'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)

