import React, { createContext, useContext, useState } from 'react';
import AlertModal from '../components/common/AlertModal';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false,
    confirmText: 'Confirmer',
    cancelText: 'Annuler'
  });

  const showAlert = (config) => {
    setAlertConfig({
      isOpen: true,
      title: config.title || 'Information',
      message: config.message || '',
      type: config.type || 'info',
      onConfirm: config.onConfirm || null,
      showCancel: config.showCancel || false,
      confirmText: config.confirmText || 'Confirmer',
      cancelText: config.cancelText || 'Annuler'
    });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        onConfirm={alertConfig.onConfirm}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
      />
    </AlertContext.Provider>
  );
};
