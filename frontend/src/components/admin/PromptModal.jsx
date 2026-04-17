import React, { useState } from "react";

const PromptModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title = "Enter Details", 
  message = "Please provide additional information:", 
  placeholder = "Enter your response...",
  submitText = "Submit",
  cancelText = "Cancel",
  defaultValue = ""
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(inputValue || "No remarks provided");
    setInputValue("");
  };

  const handleClose = () => {
    onClose();
    setInputValue("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full mx-4 transform transition-all">
        <div className="flex items-start">
          <div className="shrink-0">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              {title}
            </h3>
            <div className="mt-2 text-sm text-gray-600">
              {message}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            autoFocus
          />
        </div>

        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
