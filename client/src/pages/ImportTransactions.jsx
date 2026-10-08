import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { fetchApi } from '../utils/api';
import { formatINR } from '../utils/formatCurrency';

const ImportTransactions = () => {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

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
        
        rows.push({
          type: type === 'income' ? 'income' : 'expense',
          amount: isNaN(amount) ? 0 : amount,
          category: rowData.category || '',
          description: rowData.description || '',
          date: rowData.date ? new Date(rowData.date).toISOString().split('T')[0] : '',
          isValid: !error,
          error
        });
      }
      
      setParsedRows(rows);
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
          <h2>Import Transactions</h2>
          <p className="dashboard-subtitle">Upload a CSV file to bulk import your transactions.</p>
        </div>

        <div className="card">
          <h3>Upload CSV</h3>
          <p className="dashboard-subtitle" style={{marginBottom: '1rem'}}>
            Ensure your CSV file has the following columns (comma separated): 
            <strong> Date, Type, Amount, Category, Description</strong>
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input type="file" accept=".csv" onChange={handleFileChange} className="form-control" style={{ maxWidth: '300px' }} />
            <button className="btn" onClick={handleParse} disabled={!file}>Preview Data</button>
          </div>
          
          {result && (
            <div className={`alert ${result.failCount > 0 ? 'alert-warning' : 'alert-success'}`} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: result.failCount > 0 ? '#fffbeb' : '#f0fdf4', border: '1px solid', borderColor: result.failCount > 0 ? '#fde68a' : '#bbf7d0', borderRadius: '4px' }}>
              <p style={{ margin: 0, color: result.failCount > 0 ? '#b45309' : '#166534' }}>
                Import complete! Successfully imported {result.successCount} transactions. {result.failCount > 0 && `${result.failCount} failed.`}
              </p>
            </div>
          )}
        </div>

        {parsedRows.length > 0 && (
          <div className="card" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Preview Import Data</h3>
              <button 
                className="btn" 
                onClick={handleImport} 
                disabled={importing || parsedRows.filter(r => r.isValid).length === 0}
              >
                {importing ? 'Importing...' : `Import ${parsedRows.filter(r => r.isValid).length} Valid Rows`}
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                    <th style={{ padding: '12px 8px' }}>Date</th>
                    <th style={{ padding: '12px 8px' }}>Type</th>
                    <th style={{ padding: '12px 8px' }}>Category</th>
                    <th style={{ padding: '12px 8px' }}>Description</th>
                    <th style={{ padding: '12px 8px' }}>Amount</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', opacity: row.isValid ? 1 : 0.6 }}>
                      <td style={{ padding: '12px 8px' }}>{row.date}</td>
                      <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>
                        <span className={`transaction-type-badge ${row.type}`}>{row.type}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{row.category}</td>
                      <td style={{ padding: '12px 8px' }}>{row.description}</td>
                      <td style={{ padding: '12px 8px', fontWeight: '600' }}>{formatINR(row.amount)}</td>
                      <td style={{ padding: '12px 8px' }}>
                        {row.isValid ? (
                          <span style={{ color: '#10b981', fontWeight: '500' }}>✓ Valid</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>⚠️ {row.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportTransactions;
