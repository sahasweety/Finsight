import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { fetchApi } from '../utils/api';
import { formatINR } from '../utils/formatCurrency';

// ── Shared validation ──────────────────────────────────────────────────────
const validateRow = (row) => {
  if (!['income', 'expense'].includes(row.type)) return 'Type must be income or expense';
  const amount = Number(row.amount);
  if (isNaN(amount) || amount <= 0) return 'Amount must be greater than 0';
  if (!row.category || row.category.trim() === '') return 'Category is required';
  if (!row.date || isNaN(new Date(row.date).getTime())) return 'Invalid date';
  return null;
};

// ── Normalise a raw data object into a preview row ─────────────────────────
const normaliseRow = (rawData) => {
  const type = (rawData.type || '').toLowerCase();
  const amount = Number(rawData.amount);
  const row = {
    type: type === 'income' ? 'income' : 'expense',
    amount: isNaN(amount) ? '' : amount,
    category: rawData.category || '',
    description: rawData.description || '',
    date: rawData.date ? new Date(rawData.date).toISOString().split('T')[0] : '',
  };
  const error = validateRow(row);
  return { ...row, isValid: !error, error };
};

const cellInputStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: '4px',
  padding: '4px 6px',
  fontSize: '0.875rem',
  width: '100%',
  boxSizing: 'border-box',
  background: '#fff',
};

const invalidCellInputStyle = {
  ...cellInputStyle,
  borderColor: '#f87171',
  background: '#fff5f5',
};

const ImportTransactions = () => {
  const [file, setFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [aiError, setAiError] = useState('');

  // ── Row editing & removal ──────────────────────────────────────────────
  const handleRowChange = (idx, field, value) => {
    setParsedRows(prev => {
      const updated = [...prev];
      const row = { ...updated[idx], [field]: value };
      const error = validateRow(row);
      updated[idx] = { ...row, isValid: !error, error };
      return updated;
    });
  };

  const handleRowRemove = (idx) => {
    setParsedRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'text/csv') {
      setFile(selected);
      setParsedRows([]);
      setResult(null);
    } else if (selected) {
      alert('Please select a valid CSV file.');
      e.target.value = null;
    }
  };

  const handleImageChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    
    if (!selected.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP).');
      e.target.value = null;
      return;
    }
    
    if (selected.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.');
      e.target.value = null;
      return;
    }
    
    setImageFile(selected);
    setAiError('');
    setResult(null);
  };

  const handleExtract = async () => {
    if (!imageFile) return;
    
    setExtracting(true);
    setAiError('');
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
      const data = await fetchApi('/ai/extract-transactions', {
        method: 'POST',
        body: formData,
      });
      
      if (!data.transactions || data.transactions.length === 0) {
        setAiError('No transactions could be extracted from this image. Please try a clearer image.');
        setExtracting(false);
        return;
      }
      
      setParsedRows(data.transactions.map(normaliseRow));
      setResult(null);
    } catch (err) {
      setAiError(err.message || 'Failed to extract transactions. Please try again.');
    } finally {
      setExtracting(false);
    }
  };

  const handleParse = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      
      if (lines.length <= 1) {
        alert('File is empty or missing data rows.');
        return;
      }

      // Basic CSV parsing (comma separated, no complex quoting handled for simplicity)
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const expectedHeaders = ['date', 'type', 'amount', 'category', 'description'];
      const isHeaderValid = expectedHeaders.every(h => headers.includes(h));
      
      if (!isHeaderValid) {
        alert('Invalid CSV format. Please ensure headers are: Date, Type, Amount, Category, Description.');
        return;
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowData = {};
        headers.forEach((h, index) => {
          rowData[h] = values[index];
        });
        
        // Validation
        const type = rowData.type?.toLowerCase();
        const amount = Number(rowData.amount);
        
        let error = null;
        if (!['income', 'expense'].includes(type)) {
          error = 'Type must be income or expense';
        } else if (isNaN(amount) || amount <= 0) {
          error = 'Amount must be greater than 0';
        } else if (!rowData.category) {
          error = 'Category is required';
        } else if (!rowData.date || isNaN(new Date(rowData.date).getTime())) {
          error = 'Invalid date format';
        }
        
        rows.push(normaliseRow(rowData));
      }

      setParsedRows(rows);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of validRows) {
      try {
        await fetchApi('/transactions', {
          method: 'POST',
          body: JSON.stringify({
            type: row.type,
            amount: row.amount,
            category: row.category,
            description: row.description,
            date: row.date
          })
        });
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    setImporting(false);
    setResult({ successCount, failCount });
    if (failCount === 0) {
      setParsedRows([]);
      setFile(null);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-heading">
          <h2>Add Transactions</h2>
          <p className="dashboard-subtitle">Upload a CSV file or an image of a receipt to import transactions.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* CSV Upload Card */}
          <div className="card">
            <h3>Upload CSV</h3>
            <p className="dashboard-subtitle" style={{marginBottom: '1rem'}}>
              Ensure your CSV file has the following columns (comma separated): 
              <strong> Date, Type, Amount, Category, Description</strong>
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="file" accept=".csv" onChange={handleFileChange} className="form-control" />
              <button className="btn" onClick={handleParse} disabled={!file} style={{ alignSelf: 'flex-start' }}>Preview Data</button>
            </div>
          </div>

          {/* AI Image Upload Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3>✨ AI Extraction</h3>
            </div>
            <p className="dashboard-subtitle" style={{marginBottom: '1rem'}}>
              Upload a receipt or bank statement (JPG, PNG, WEBP) up to 5MB. FinSight AI will automatically extract the transactions for you.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="file" accept="image/*" onChange={handleImageChange} className="form-control" />
              <button className="btn" onClick={handleExtract} disabled={!imageFile || extracting} style={{ alignSelf: 'flex-start' }}>
                {extracting ? 'Analyzing image...' : 'Extract Transactions'}
              </button>
            </div>
            
            {aiError && (
              <div className="alert alert-warning" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '4px' }}>
                <p style={{ margin: 0 }}>⚠️ {aiError}</p>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className={`alert ${result.failCount > 0 ? 'alert-warning' : 'alert-success'}`} style={{ marginTop: '2rem', padding: '1rem', backgroundColor: result.failCount > 0 ? '#fffbeb' : '#f0fdf4', border: '1px solid', borderColor: result.failCount > 0 ? '#fde68a' : '#bbf7d0', borderRadius: '4px' }}>
            <p style={{ margin: 0, color: result.failCount > 0 ? '#b45309' : '#166534' }}>
              Import complete! Successfully imported {result.successCount} transactions. {result.failCount > 0 && `${result.failCount} failed.`}
            </p>
          </div>
        )}

        {parsedRows.length > 0 && (() => {
          const invalidRows = parsedRows.filter(r => !r.isValid);
          const validRows   = parsedRows.filter(r => r.isValid);
          const hasInvalid  = invalidRows.length > 0;
          const canImport   = !importing && !hasInvalid && validRows.length > 0;

          return (
            <div className="card" style={{ marginTop: '2rem' }}>
              {/* Preview header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>Review Transactions</h3>
                  <p className="dashboard-subtitle" style={{ margin: 0 }}>
                    {validRows.length} ready to import
                    {hasInvalid && (
                      <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>
                        · {invalidRows.length} row{invalidRows.length > 1 ? 's' : ''} with errors — fix or remove before importing.
                      </span>
                    )}
                  </p>
                </div>
                <button
                  className="btn"
                  onClick={handleImport}
                  disabled={!canImport}
                  title={hasInvalid ? 'Fix or remove invalid rows before importing' : ''}
                >
                  {importing ? 'Importing…' : `Import ${validRows.length} Row${validRows.length !== 1 ? 's' : ''}`}
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                      <th style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>Date</th>
                      <th style={{ padding: '10px 8px' }}>Type</th>
                      <th style={{ padding: '10px 8px' }}>Amount</th>
                      <th style={{ padding: '10px 8px' }}>Category</th>
                      <th style={{ padding: '10px 8px' }}>Description</th>
                      <th style={{ padding: '10px 8px' }}>Status</th>
                      <th style={{ padding: '10px 8px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => {
                      const inputStyle = row.isValid ? cellInputStyle : invalidCellInputStyle;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', background: row.isValid ? 'transparent' : '#fff9f9' }}>
                          {/* Date */}
                          <td style={{ padding: '8px' }}>
                            <input
                              type="date"
                              value={row.date}
                              onChange={e => handleRowChange(idx, 'date', e.target.value)}
                              style={{ ...inputStyle, minWidth: '130px' }}
                            />
                          </td>
                          {/* Type */}
                          <td style={{ padding: '8px' }}>
                            <select
                              value={row.type}
                              onChange={e => handleRowChange(idx, 'type', e.target.value)}
                              style={{ ...inputStyle, minWidth: '100px' }}
                            >
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                            </select>
                          </td>
                          {/* Amount */}
                          <td style={{ padding: '8px' }}>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={row.amount}
                              onChange={e => handleRowChange(idx, 'amount', e.target.value)}
                              style={{ ...inputStyle, minWidth: '90px' }}
                            />
                          </td>
                          {/* Category */}
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              value={row.category}
                              onChange={e => handleRowChange(idx, 'category', e.target.value)}
                              placeholder="Category"
                              style={{ ...inputStyle, minWidth: '110px' }}
                            />
                          </td>
                          {/* Description */}
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              value={row.description}
                              onChange={e => handleRowChange(idx, 'description', e.target.value)}
                              placeholder="Description"
                              style={{ ...inputStyle, minWidth: '140px' }}
                            />
                          </td>
                          {/* Status */}
                          <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                            {row.isValid ? (
                              <span style={{ color: '#10b981', fontWeight: '500' }}>✓ Valid</span>
                            ) : (
                              <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>⚠️ {row.error}</span>
                            )}
                          </td>
                          {/* Action */}
                          <td style={{ padding: '8px' }}>
                            <button
                              onClick={() => handleRowRemove(idx)}
                              title="Remove this row"
                              style={{
                                background: 'none',
                                border: '1px solid #fca5a5',
                                borderRadius: '4px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                fontSize: '0.8rem',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              🗑 Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ImportTransactions;
