import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export interface ChangelogItem {
    version: string;
    date: string;
    changes: string[];
}

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  changelogItems: ChangelogItem[];
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose, changelogItems }) => {
  const { t } = useLanguage();

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="changelog-modal-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-11/12 max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-sm rounded-t-xl">
          <h2 id="changelog-modal-title" className="text-xl font-bold text-gray-800">{t('changelog_modal_title')}</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t('common_close_esc')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          <div className="space-y-6">
            {changelogItems.map((item) => (
              <div key={item.version}>
                <h3 className="font-semibold text-slate-800 mb-1">
                  <span className="bg-blue-100 text-blue-800 text-sm font-semibold me-2 px-2.5 py-0.5 rounded-full">{item.version}</span>
                  <span className="text-sm text-slate-500 font-normal">{item.date}</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 pl-2 mt-2">
                  {item.changes.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};