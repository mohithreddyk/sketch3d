import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onDismiss, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Allow time for the fade-out animation before calling onDismiss
        setTimeout(onDismiss, 300);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [message, duration, onDismiss]);
  
  if (!message) return null;

  return (
    <div 
      className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-2xl border bg-red-900/50 border-red-500/50 backdrop-blur-md text-white transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}
      onClick={onDismiss}
    >
      <p className="font-bold text-center">{message}</p>
    </div>
  );
};
