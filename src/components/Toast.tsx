import React, { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, message.duration || 5000);

    return () => clearTimeout(timer);
  }, [message.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(message.id);
    }, 300);
  };

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = "max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out";

    if (isExiting) {
      return `${baseStyles} translate-x-full opacity-0`;
    }

    return `${baseStyles} translate-x-0 opacity-100`;
  };

  const getIconAndColors = () => {
    switch (message.type) {
      case 'success':
        return {
          icon: (
            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          titleColor: 'text-green-800',
          messageColor: 'text-green-600',
          borderColor: 'border-l-green-500'
        };
      case 'error':
        return {
          icon: (
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          titleColor: 'text-red-800',
          messageColor: 'text-red-600',
          borderColor: 'border-l-red-500'
        };
      case 'warning':
        return {
          icon: (
            <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-600',
          borderColor: 'border-l-yellow-500'
        };
      case 'info':
      default:
        return {
          icon: (
            <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-600',
          borderColor: 'border-l-blue-500'
        };
    }
  };

  const { icon, titleColor, messageColor, borderColor } = getIconAndColors();

  return (
    <div className={getToastStyles()}>
      <div className={`border-l-4 ${borderColor} p-4`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className={`text-sm font-medium ${titleColor} break-words`}>
              {message.title}
            </p>
            <p className={`mt-1 text-sm ${messageColor} break-words`}>
              {message.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleClose}
              aria-label="Close"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  messages: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onClose }) => {
  return (
    <div className="fixed top-0 right-0 z-50 p-6 space-y-4 pointer-events-none">
      {messages.map((message) => (
        <Toast key={message.id} message={message} onClose={onClose} />
      ))}
    </div>
  );
};

// Hook for managing toast messages
export const useToast = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { ...toast, id };

    setMessages(prev => [...prev, newToast]);

    return id;
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(message => message.id !== id));
  };

  const clearAllToasts = () => {
    setMessages([]);
  };

  // Listen for global error events
  useEffect(() => {
    const handleAppError = (event: CustomEvent) => {
      const { title, message } = event.detail;
      addToast({
        title,
        message,
        type: 'error',
        duration: 7000
      });
    };

    window.addEventListener('app-error', handleAppError as EventListener);

    return () => {
      window.removeEventListener('app-error', handleAppError as EventListener);
    };
  }, []);

  return {
    messages,
    addToast,
    removeToast,
    clearAllToasts
  };
};