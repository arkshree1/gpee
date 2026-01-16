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
    lowerMsg.includes('required') ||
    lowerMsg.includes('denied') ||
    lowerMsg.includes('rejected') ||
    lowerMsg.includes('must be') ||
    lowerMsg.includes('cannot') ||
    lowerMsg.includes('not allowed') ||
    lowerMsg.includes('please fill') ||
    lowerMsg.includes('confirm that') ||
    lowerMsg.includes('incorrect') ||
    lowerMsg.includes('10 digits');

  return (
    <div className="sd-modal-overlay" onClick={onClose}>
      <div className="sd-popup-card" onClick={(e) => e.stopPropagation()}>
        <div className={`sd-popup-icon ${isError ? 'error' : 'success'}`}>
          {isError ? '✕' : '✓'}
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
