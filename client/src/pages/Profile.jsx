import React from 'react';
import Navbar from '../components/Navbar';

const Profile = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-heading">
          <h2>My Profile</h2>
          <p className="dashboard-subtitle">Manage your personal information.</p>
        </div>

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="profile-details">
            <div className="form-group">
              <label>Name</label>
              <input type="text" className="form-control" value={user.name || ''} readOnly />
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-control" value={user.email || ''} readOnly />
            </div>

            <div className="alert alert-info" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '4px', borderLeft: '4px solid #3b82f6' }}>
              <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.9rem' }}>
                Profile editing is not yet supported in the current version of FinSight. 
                Your information is securely stored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
