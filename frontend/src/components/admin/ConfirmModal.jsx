import React from "react";

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      bg: "bg-red-50",
      border: "border-red-200",
      title: "text-red-800",
      message: "text-red-600",
      confirmBtn: "bg-red-600 hover:bg-red-700 text-white",
      icon: "text-red-500"
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200", 
      title: "text-yellow-800",
      message: "text-yellow-600",
      confirmBtn: "bg-yellow-600 hover:bg-yellow-700 text-white",
      icon: "text-yellow-500"
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      title: "text-blue-800", 
      message: "text-blue-600",
      confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white",
      icon: "text-blue-500"
    }
  };

  const styles = typeStyles[type] || typeStyles.danger;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`${styles.bg} ${styles.border} border rounded-lg p-6 max-w-md w-full mx-4 transform transition-all`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {/* Icon */}
            <svg className={`h-6 w-6 ${styles.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {type === 'danger' && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              )}
              {type === 'warning' && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              )}
              {type === 'info' && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-lg font-medium ${styles.title}`}>
              {title}
            </h3>
            <div className={`mt-2 text-sm ${styles.message}`}>
              {message}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
