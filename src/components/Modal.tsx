import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity" 
          onClick={onClose}
        ></div>

        <div className={`relative transform overflow-hidden rounded-lg bg-white dark:bg-surface-800 text-right shadow-xl transition-all sm:my-8 w-full ${maxWidth}`}>
          <div className="bg-white dark:bg-surface-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-surface-200 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold leading-6 text-surface-900 dark:text-white">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-surface-400 hover:text-surface-500 dark:hover:text-surface-300 transition-colors"
              >
                <span className="sr-only">إغلاق</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          
          <div className="px-4 py-5 sm:p-6 text-right">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
