import React, { useEffect } from 'react';
import './ThankYouModal.css';

const ThankYouModal = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="thankyou-overlay" onClick={onClose}>
      <div className="thankyou-modal" onClick={(e) => e.stopPropagation()}>
        <div className="thankyou-icon">
          <div className="checkmark-circle">
            <svg className="checkmark" viewBox="0 0 52 52">
              <circle className="checkmark-circle-path" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
        </div>
        <h2 className="thankyou-title">Thank You!</h2>
        <p className="thankyou-message">Your feedback has been submitted successfully.</p>
        <p className="thankyou-submessage">We appreciate your time and input.</p>
        <button className="thankyou-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ThankYouModal;
