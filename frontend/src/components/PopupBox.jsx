import React from 'react';
import '../styles/popup.css';

const PopupBox = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="popup-backdrop" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="popup-content">
          <p className="popup-message">{message}</p>
          <button type="button" className="popup-button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupBox;
