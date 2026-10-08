import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { fetchApi } from '../utils/api';
import { formatINR } from '../utils/formatCurrency';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/transactions');
      setTransactions(data.transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditClick = (t) => {
    setEditingId(t._id);
    setFormData({
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description || '',
      date: new Date(t.date).toISOString().split('T')[0]
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await fetchApi(`/transactions/${id}`, { method: 'DELETE' });
      setSuccess('Transaction deleted successfully');
      loadTransactions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { type, amount, category, description, date } = formData;
    if (!amount || amount <= 0) {
      return setError('Amount must be greater than 0');
    }
    if (!category) {
      return setError('Category is required');
    }

    try {
      if (editingId) {
        await fetchApi(`/transactions/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ type, amount: Number(amount), category, description, date })
        });
        setSuccess('Transaction updated successfully');
      } else {
        await fetchApi('/transactions', {
          method: 'POST',
          body: JSON.stringify({ type, amount: Number(amount), category, description, date })
        });
        setSuccess('Transaction added successfully');
      }
      
      handleCancelEdit(); // Reset form
      loadTransactions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <div className="transactions-layout">
          
          <div className="transaction-form-section">
            <div className="card">
              <h3>{editingId ? 'Edit Transaction' : 'Add Transaction'}</h3>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" className="form-control" value={formData.type} onChange={handleChange}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Amount</label>
                  <input type="number" step="0.01" name="amount" className="form-control" value={formData.amount} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" name="category" className="form-control" value={formData.category} onChange={handleChange} placeholder="e.g. Food, Salary, Rent" />
                </div>
                
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <input type="text" name="description" className="form-control" value={formData.description} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" name="date" className="form-control" value={formData.date} onChange={handleChange} />
                </div>
                
                <button type="submit" className="btn">
                  {editingId ? 'Update Transaction' : 'Add Transaction'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} style={{ marginTop: '0.5rem' }}>
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>
          </div>

          <div className="transaction-list-section">
            <h3>Your Transactions</h3>
            {loading ? (
              <p>Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <div className="empty-state">
                No transactions yet. Add your first income or expense.
              </div>
            ) : (
              <div className="transaction-list">
                {transactions.map(t => (
                  <div key={t._id} className={`transaction-item ${t.type}`}>
                    <div className="transaction-info">
                      <div className="transaction-main">
                        <span className="transaction-category">{t.category}</span>
                        <span className="transaction-date">{new Date(t.date).toLocaleDateString()}</span>
                      </div>
                      {t.description && <div className="transaction-desc">{t.description}</div>}
                    </div>
                    <div className="transaction-actions">
                      <span className={`transaction-amount ${t.type}`}>
                        {t.type === 'income' ? '+' : '-'}{formatINR(t.amount)}
                      </span>
                      <div className="action-buttons">
                        <button onClick={() => handleEditClick(t)} className="btn-small">Edit</button>
                        <button onClick={() => handleDelete(t._id)} className="btn-small btn-danger">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
