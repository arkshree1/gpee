import React from 'react';
import '../styles/student-dashboard.css';

const PopupBox = ({ message, onClose }) => {
  if (!message) return null;

  // Detect if message is an error/warning based on keywords
  const lowerMsg = message.toLowerCase();
  const isError =
    lowerMsg.includes('error') ||
    lowerMsg.includes('failed') ||
    lowerMsg.includes('invalid') ||
    lowerMsg.includes('not registered') ||
    lowerMsg.includes('not exist') ||
    lowerMsg.includes('does not exist') ||
    lowerMsg.includes('required') ||
    lowerMsg.includes('denied') ||
    lowerMsg.includes('rejected') ||
    lowerMsg.includes('must be') ||
    lowerMsg.includes('cannot') ||
    lowerMsg.includes('not allowed') ||
    lowerMsg.includes('please fill') ||
    lowerMsg.includes('confirm that') ||
    lowerMsg.includes('incorrect') ||
    lowerMsg.includes('10 digits') ||
    lowerMsg.includes('active local gatepass') ||
    lowerMsg.includes('active gatepass');

  return (
    <div className="sd-modal-overlay" onClick={onClose}>
      <div className="sd-popup-card" onClick={(e) => e.stopPropagation()}>
        <div className={`sd-popup-icon ${isError ? 'error' : 'success'}`}>
          {isError ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </div>
        <p className="sd-popup-message">{message}</p>
        <button type="button" className="sd-popup-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default PopupBox;
