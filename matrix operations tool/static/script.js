let matrix1 = null;
let matrix2 = null;

function createMatrix(matrixNum) {
    const rows = parseInt(document.getElementById(`rows${matrixNum}`).value);
    const cols = parseInt(document.getElementById(`cols${matrixNum}`).value);
    
    if (rows < 1 || cols < 1 || rows > 10 || cols > 10) {
        alert('Matrix dimensions must be between 1 and 10');
        return;
    }
    
    const container = document.getElementById(`matrix${matrixNum}-container`);
    container.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.className = 'matrix-grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.value = '0';
            input.dataset.row = i;
            input.dataset.col = j;
            input.dataset.matrix = matrixNum;
            input.placeholder = `[${i},${j}]`;
            
            // Add keyboard navigation
            input.addEventListener('keydown', handleKeyNavigation);
            
            grid.appendChild(input);
        }
    }
    
    container.appendChild(grid);
}

function getMatrixValues(matrixNum) {
    const container = document.getElementById(`matrix${matrixNum}-container`);
    const inputs = container.querySelectorAll('input');
    
    if (inputs.length === 0) {
        return null;
    }
    
    const rows = parseInt(document.getElementById(`rows${matrixNum}`).value);
    const cols = parseInt(document.getElementById(`cols${matrixNum}`).value);
    const matrix = [];
    
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            const input = container.querySelector(`input[data-row="${i}"][data-col="${j}"]`);
            row.push(parseFloat(input.value) || 0);
        }
        matrix.push(row);
    }
    
    return matrix;
}

async function performOperation(operation, matrixNum = 1) {
    const resultContainer = document.getElementById('result-container');
    resultContainer.innerHTML = '<p class="placeholder">Processing...</p>';
    
    try {
        let url = '';
        let body = {};
        let matrixLabel = '';
        
        if (operation === 'transpose' || operation === 'determinant') {
            const matrix = getMatrixValues(matrixNum);
            if (!matrix) {
                throw new Error(`Please create Matrix ${matrixNum} first`);
            }
            
            matrixLabel = matrixNum === 1 ? 'A' : 'B';
            url = `/api/${operation}`;
            body = { matrix: matrix };
        } else {
            matrix1 = getMatrixValues(1);
            matrix2 = getMatrixValues(2);
            
            if (!matrix1 || !matrix2) {
                throw new Error('Please create both matrices first');
            }
            
            url = `/api/${operation}`;
            body = {
                matrix1: matrix1,
                matrix2: matrix2
            };
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Operation failed');
        }
        
        displayResult(data, operation, matrixLabel);
        
    } catch (error) {
        resultContainer.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${error.message}
            </div>
        `;
        
        // Auto-scroll to result section even on error
        setTimeout(() => {
            const resultSection = document.querySelector('.result-section');
            if (resultSection) {
                resultSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
        }, 100);
    }
}

function displayResult(data, operation, matrixLabel = 'A') {
    const resultContainer = document.getElementById('result-container');
    
    if (operation === 'determinant') {
        const formattedResult = formatNumber(data.result);
        resultContainer.innerHTML = `
            <div class="success-message">
                <strong>✓ Operation Successful!</strong>
            </div>
            <div class="determinant-result">
                det(${matrixLabel}) = ${formattedResult}
            </div>
        `;
    } else if (operation === 'transpose') {
        resultContainer.innerHTML = `
            <div class="success-message">
                <strong>✓ Operation Successful!</strong>
            </div>
            <div class="result-info">
                <strong>${matrixLabel}ᵀ Shape:</strong> ${data.shape[0]} × ${data.shape[1]}
            </div>
            ${displayMatrix(data.result)}
        `;
    } else {
        resultContainer.innerHTML = `
            <div class="success-message">
                <strong>✓ Operation Successful!</strong>
            </div>
            <div class="result-info">
                <strong>Result Shape:</strong> ${data.shape[0]} × ${data.shape[1]}
            </div>
            ${displayMatrix(data.result)}
        `;
    }
    
    // Auto-scroll to result section
    setTimeout(() => {
        const resultSection = document.querySelector('.result-section');
        if (resultSection) {
            resultSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }, 100);
}

function formatNumber(num) {
    if (typeof num !== 'number') {
        return num;
    }
    // Check if the number is an integer (or very close to an integer)
    if (Number.isInteger(num) || Math.abs(num - Math.round(num)) < 1e-10) {
        return Math.round(num).toString();
    }
    // Otherwise, format as decimal
    return num.toString();
}

function displayMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    
    let html = '<div class="result-matrix">';
    html += '<div class="result-matrix-grid" style="grid-template-columns: repeat(' + cols + ', auto);">';
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const value = formatNumber(matrix[i][j]);
            html += `<div class="result-cell">${value}</div>`;
        }
    }
    
    html += '</div></div>';
    return html;
}

function handleKeyNavigation(event) {
    const input = event.target;
    const key = event.key;
    
    // Only handle arrow keys
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) {
        return;
    }
    
    // Get current position and matrix number
    const currentRow = parseInt(input.dataset.row);
    const currentCol = parseInt(input.dataset.col);
    const matrixNum = parseInt(input.dataset.matrix);
    
    // Get matrix dimensions
    const rows = parseInt(document.getElementById(`rows${matrixNum}`).value);
    const cols = parseInt(document.getElementById(`cols${matrixNum}`).value);
    
    let newRow = currentRow;
    let newCol = currentCol;
    let shouldNavigate = false;
    
    // Calculate new position based on key
    switch (key) {
        case 'ArrowUp':
            if (currentRow > 0) {
                newRow = currentRow - 1;
                shouldNavigate = true;
            }
            break;
        case 'ArrowDown':
            if (currentRow < rows - 1) {
                newRow = currentRow + 1;
                shouldNavigate = true;
            } else if (currentRow === rows - 1 && event.shiftKey) {
                // Allow wrapping from bottom to top with Shift+Down
                newRow = 0;
                shouldNavigate = true;
            }
            break;
        case 'ArrowLeft':
            if (currentCol > 0) {
                newCol = currentCol - 1;
                shouldNavigate = true;
            } else if (currentCol === 0 && currentRow > 0) {
                // Wrap to end of previous row
                newRow = currentRow - 1;
                newCol = cols - 1;
                shouldNavigate = true;
            }
            break;
        case 'ArrowRight':
            if (currentCol < cols - 1) {
                newCol = currentCol + 1;
                shouldNavigate = true;
            } else if (currentCol === cols - 1 && currentRow < rows - 1) {
                // Wrap to start of next row
                newRow = currentRow + 1;
                newCol = 0;
                shouldNavigate = true;
            }
            break;
        case 'Enter':
            // On Enter, move to next cell (right, or down if at end of row)
            if (currentCol < cols - 1) {
                newCol = currentCol + 1;
                shouldNavigate = true;
            } else if (currentRow < rows - 1) {
                newRow = currentRow + 1;
                newCol = 0;
                shouldNavigate = true;
            }
            break;
    }
    
    // Navigate to new cell if valid
    if (shouldNavigate) {
        event.preventDefault();
        const container = document.getElementById(`matrix${matrixNum}-container`);
        const targetInput = container.querySelector(`input[data-row="${newRow}"][data-col="${newCol}"]`);
        if (targetInput) {
            targetInput.focus();
            targetInput.select(); // Select text for easy replacement
        }
    }
}

// Initialize matrices on page load
window.addEventListener('DOMContentLoaded', () => {
    createMatrix(1);
    createMatrix(2);
});

