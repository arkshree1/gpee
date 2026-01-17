import React from 'react';
import '../styles/admin.css';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  decision, 
  studentName, 
  rollNumber, 
  reasonOfLeave,
  isLocal = false,
  purpose,
  place,
  isProcessing = false 
}) => {
  if (!isOpen) return null;

  const isApprove = decision === 'approved';
  const actionText = isApprove ? 'Approve' : 'Reject';
  const actionColor = isApprove ? '#2eb7a5' : '#e74c3c';

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="confirm-modal-close" onClick={onClose}>×</button>
        
        <div className="confirm-modal-header" style={{ borderLeftColor: actionColor }}>
          <h3>Confirm {actionText}</h3>
        </div>
        
        <div className="confirm-modal-body">
          <p className="confirm-modal-question">
            Are you sure you want to <strong style={{ color: actionColor }}>{actionText.toLowerCase()}</strong> this gatepass?
          </p>
          
          <div className="confirm-modal-details">
            <div className="confirm-modal-detail-row">
              <span className="confirm-modal-label">Student Name:</span>
              <span className="confirm-modal-value">{studentName}</span>
            </div>
            <div className="confirm-modal-detail-row">
              <span className="confirm-modal-label">Roll Number:</span>
              <span className="confirm-modal-value">{rollNumber}</span>
            </div>
            {isLocal ? (
              <>
                <div className="confirm-modal-detail-row">
                  <span className="confirm-modal-label">Place:</span>
                  <span className="confirm-modal-value">{place || '--'}</span>
                </div>
                <div className="confirm-modal-detail-row">
                  <span className="confirm-modal-label">Purpose:</span>
                  <span className="confirm-modal-value">{purpose || '--'}</span>
                </div>
              </>
            ) : (
              <div className="confirm-modal-detail-row">
                <span className="confirm-modal-label">Reason of Leave:</span>
                <span className="confirm-modal-value">{reasonOfLeave || '--'}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="confirm-modal-actions">
          <button 
            className="confirm-modal-cancel" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            className="confirm-modal-confirm"
            style={{ backgroundColor: actionColor }}
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : `Yes, ${actionText}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
