import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchApi } from '../utils/api';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!password || !confirmPassword) {
      return setError('Please fill in all fields');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const data = await fetchApi(`/users/reset-password/${token}`, {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      setMessage(data.message);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'This password reset link is invalid or has expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          <Link to="/login" className="btn" style={{ display: 'block', textAlign: 'center', marginTop: '1rem' }}>
            Go to Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
