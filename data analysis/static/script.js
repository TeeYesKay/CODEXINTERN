let currentFilename = null;
let datasetInfo = null;

// File upload handling
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (!file.name.endsWith('.csv')) {
        showError('Please upload a CSV file');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    showLoading();
    
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            currentFilename = data.filename;
            datasetInfo = data.info;
            displayFileInfo(data);
            populateColumns(data.info.column_names);
            showSections();
        } else {
            showError(data.error || 'Upload failed');
        }
    })
    .catch(error => {
        hideLoading();
        showError('Error uploading file: ' + error.message);
    });
}

function displayFileInfo(data) {
    const info = data.info;
    fileInfo.className = 'file-info';
    fileInfo.innerHTML = `
        <strong>✓ File uploaded successfully!</strong><br>
        <strong>${data.filename}</strong><br>
        Rows: ${info.rows} | Columns: ${info.columns}
    `;

    // Display dataset info
    const infoSection = document.getElementById('infoSection');
    const datasetInfoDiv = document.getElementById('datasetInfo');
    
    let html = `
        <div class="dataset-grid">
            <div class="dataset-item">
                <strong>Total Rows</strong>
                ${info.rows.toLocaleString()}
            </div>
            <div class="dataset-item">
                <strong>Total Columns</strong>
                ${info.columns}
            </div>
            <div class="dataset-item">
                <strong>Missing Values</strong>
                ${Object.values(info.missing_values).reduce((a, b) => a + b, 0)}
            </div>
        </div>
        <h3 style="margin-top: 24px;">Columns</h3>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Column Name</th>
                        <th>Data Type</th>
                        <th>Missing Values</th>
                    </tr>
                </thead>
                <tbody>
                    ${info.column_names.map(col => `
                        <tr>
                            <td><strong>${col}</strong></td>
                            <td>${info.data_types[col]}</td>
                            <td>${info.missing_values[col]}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <h3 style="margin-top: 24px;">Sample Data (First 10 rows)</h3>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        ${info.column_names.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${info.sample_data.map(row => `
                        <tr>
                            ${info.column_names.map(col => `<td>${row[col] ?? ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    datasetInfoDiv.innerHTML = html;
    infoSection.classList.remove('hidden');
}

function populateColumns(columns) {
    const selects = ['columnSelect', 'barColumn', 'scatterX', 'scatterY'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Choose a column...</option>' +
            columns.map(col => `<option value="${col}">${col}</option>`).join('');
    });
}

function showSections() {
    document.getElementById('analysisSection').classList.remove('hidden');
    document.getElementById('vizSection').classList.remove('hidden');
    document.getElementById('insightsSection').classList.remove('hidden');
}

// Analysis
document.getElementById('analyzeBtn').addEventListener('click', () => {
    const column = document.getElementById('columnSelect').value;
    if (!column) {
        alert('Please select a column');
        return;
    }

    showLoading();
    
    fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: currentFilename, column })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            displayAnalysisResults(data);
        } else {
            showError(data.error || 'Analysis failed');
        }
    })
    .catch(error => {
        hideLoading();
        showError('Error analyzing data: ' + error.message);
    });
});

function displayAnalysisResults(data) {
    const resultsDiv = document.getElementById('analysisResults');
    const stats = data.statistics;
    
    let html = `<h3>Statistics for "${data.column}"</h3>`;
    
    if (stats.is_numeric) {
        html += `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Mean (Average)</div>
                    <div class="stat-value">${stats.mean.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Median</div>
                    <div class="stat-value">${stats.median.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Standard Deviation</div>
                    <div class="stat-value">${stats.std.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Minimum</div>
                    <div class="stat-value">${stats.min.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Maximum</div>
                    <div class="stat-value">${stats.max.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Count</div>
                    <div class="stat-value">${stats.count}</div>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Count</div>
                    <div class="stat-value">${stats.count}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Unique Values</div>
                    <div class="stat-value">${stats.unique}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Most Frequent</div>
                    <div class="stat-value">${stats.most_frequent || 'N/A'}</div>
                </div>
            </div>
        `;
    }
    
    resultsDiv.innerHTML = html;
    resultsDiv.classList.remove('hidden');
}

// Visualizations
document.getElementById('barChartBtn').addEventListener('click', () => {
    const column = document.getElementById('barColumn').value;
    if (!column) {
        alert('Please select a column');
        return;
    }

    showLoading();
    
    fetch('/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: currentFilename, type: 'bar', column })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            document.getElementById('barChartContainer').innerHTML = 
                `<img src="data:image/png;base64,${data.plot}" alt="Bar Chart">`;
            document.getElementById('barChartContainer').classList.remove('hidden');
        } else {
            alert(data.error || 'Failed to generate chart');
        }
    })
    .catch(error => {
        hideLoading();
        alert('Error generating chart: ' + error.message);
    });
});

document.getElementById('scatterPlotBtn').addEventListener('click', () => {
    const xCol = document.getElementById('scatterX').value;
    const yCol = document.getElementById('scatterY').value;
    
    if (!xCol || !yCol) {
        alert('Please select both X and Y columns');
        return;
    }

    showLoading();
    
    fetch('/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: currentFilename, type: 'scatter', x_column: xCol, y_column: yCol })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            document.getElementById('scatterPlotContainer').innerHTML = 
                `<img src="data:image/png;base64,${data.plot}" alt="Scatter Plot">`;
            document.getElementById('scatterPlotContainer').classList.remove('hidden');
        } else {
            alert(data.error || 'Failed to generate chart');
        }
    })
    .catch(error => {
        hideLoading();
        alert('Error generating chart: ' + error.message);
    });
});

document.getElementById('heatmapBtn').addEventListener('click', () => {
    showLoading();
    
    fetch('/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: currentFilename, type: 'heatmap' })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            document.getElementById('heatmapContainer').innerHTML = 
                `<img src="data:image/png;base64,${data.plot}" alt="Heatmap">`;
            document.getElementById('heatmapContainer').classList.remove('hidden');
        } else {
            alert(data.error || 'Failed to generate heatmap');
        }
    })
    .catch(error => {
        hideLoading();
        alert('Error generating heatmap: ' + error.message);
    });
});

// Insights
document.getElementById('insightsBtn').addEventListener('click', () => {
    showLoading();
    
    fetch('/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: currentFilename })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            const insightsDiv = document.getElementById('insightsContent');
            insightsDiv.innerHTML = data.insights.map(insight => 
                `<div class="insight-item">${insight}</div>`
            ).join('');
            insightsDiv.classList.remove('hidden');
        } else {
            alert(data.error || 'Failed to generate insights');
        }
    })
    .catch(error => {
        hideLoading();
        alert('Error generating insights: ' + error.message);
    });
});

// Utility functions
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showError(message) {
    fileInfo.className = 'file-info error';
    fileInfo.innerHTML = `<strong>Error:</strong> ${message}`;
}

