import React from 'react';
import { X, CheckCircle, AlertCircle, Info, HelpCircle } from 'lucide-react';
import './AlertModal.css';

const AlertModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info', 'question'
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  showCancel = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="alert-modal-icon success" size={48} />;
      case 'error': return <AlertCircle className="alert-modal-icon error" size={48} />;
      case 'warning': return <AlertCircle className="alert-modal-icon warning" size={48} />;
      case 'question': return <HelpCircle className="alert-modal-icon question" size={48} />;
      default: return <Info className="alert-modal-icon info" size={48} />;
    }
  };

  return (
    <div className="alert-modal-overlay">
      <div className="alert-modal-container animate-in">
        <button className="alert-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="alert-modal-content">
          <div className="alert-modal-icon-wrapper">
            {getIcon()}
          </div>
          
          <h2 className="alert-modal-title">{title}</h2>
          <p className="alert-modal-message">{message}</p>
        </div>

        <div className="alert-modal-footer">
          {showCancel && (
            <button className="alert-modal-btn cancel" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button 
            className={`alert-modal-btn confirm ${type}`} 
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
