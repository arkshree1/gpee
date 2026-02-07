import React, { useState } from 'react';
import '../styles/admin.css';

const EditProfileModal = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  currentEmail,
  roleName = 'User',
  isProcessing = false 
}) => {
  const [email, setEmail] = useState(currentEmail || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validate email format if changed
    if (email && email !== currentEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        return;
      }
    }

    // Validate password if changing
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setError('Current password is required to change password');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }
    }

    // Check if anything changed
    const emailChanged = email && email !== currentEmail;
    const passwordChanged = newPassword && currentPassword;

    if (!emailChanged && !passwordChanged) {
      setError('No changes detected');
      return;
    }

    const payload = {};
    if (emailChanged) payload.email = email;
    if (passwordChanged) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    onUpdate(payload);
  };

  const handleClose = () => {
    setEmail(currentEmail || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={handleClose}>
      <div className="confirm-modal edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="confirm-modal-close" onClick={handleClose}>×</button>
        
        <div className="confirm-modal-header" style={{ borderLeftColor: '#2eb7a5' }}>
          <h3>Edit Profile</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="confirm-modal-body">
            <p className="edit-profile-subtitle">
              Update your email or password for the <strong>{roleName}</strong> account
            </p>
            
            {error && (
              <div className="edit-profile-error">
                {error}
              </div>
            )}

            <div className="edit-profile-section">
              <h4 className="edit-profile-section-title">Change Email</h4>
              <div className="edit-profile-field">
                <label className="edit-profile-label">Email Address</label>
                <input
                  type="email"
                  className="edit-profile-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter new email"
                />
              </div>
            </div>

            <div className="edit-profile-section">
              <h4 className="edit-profile-section-title">Change Password</h4>
              <div className="edit-profile-field">
                <label className="edit-profile-label">Current Password</label>
                <div className="edit-profile-password-wrapper">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="edit-profile-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="edit-profile-toggle-password"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              <div className="edit-profile-field">
                <label className="edit-profile-label">New Password</label>
                <div className="edit-profile-password-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="edit-profile-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    className="edit-profile-toggle-password"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              <div className="edit-profile-field">
                <label className="edit-profile-label">Confirm New Password</label>
                <div className="edit-profile-password-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="edit-profile-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="edit-profile-toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="confirm-modal-actions">
            <button 
              type="button"
              className="confirm-modal-cancel" 
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="confirm-modal-confirm"
              style={{ backgroundColor: '#2eb7a5' }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
