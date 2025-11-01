import React, { useState } from 'react';
import { Project } from '../types';
import Button from './Button';
import { useLanguage } from '../contexts/LanguageContext';

export interface ConflictInfo {
  id: string;
  name: string;
  localProject: Project;
  cloudProject: Project;
}

interface ConflictResolutionModalProps {
  conflicts: ConflictInfo[];
  onResolve: (projectId: string, resolution: 'keep-local' | 'use-cloud') => Promise<void>;
  onClose: () => void;
}

const ConflictItem: React.FC<{
  conflict: ConflictInfo;
  onResolve: (projectId: string, resolution: 'keep-local' | 'use-cloud') => Promise<void>;
  isProcessing: boolean;
}> = ({ conflict, onResolve, isProcessing }) => {
  const { t } = useLanguage();
  const localDate = new Date(conflict.localProject.lastModified).toLocaleString();
  const cloudDate = new Date(conflict.cloudProject.lastModified).toLocaleString();
  const isLocalNewer = conflict.localProject.lastModified > conflict.cloudProject.lastModified;

  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
      <h4 className="font-semibold text-slate-800 text-base mb-3 truncate" title={conflict.name}>{conflict.name}</h4>
      <div className="space-y-2 text-sm">
        <div className={`p-2 rounded-md border ${isLocalNewer ? 'border-blue-400 bg-blue-50' : 'border-slate-300'}`}>
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-700">{t('conflict_modal_local_version')}</span>
            {isLocalNewer && <span className="text-xs font-bold text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full">{t('conflict_modal_newer')}</span>}
          </div>
          <span className="text-slate-500">{localDate}</span>
        </div>
        <div className={`p-2 rounded-md border ${!isLocalNewer ? 'border-blue-400 bg-blue-50' : 'border-slate-300'}`}>
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-700">{t('conflict_modal_cloud_version')}</span>
            {!isLocalNewer && <span className="text-xs font-bold text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full">{t('conflict_modal_newer')}</span>}
          </div>
          <span className="text-slate-500">{cloudDate}</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button onClick={() => onResolve(conflict.id, 'keep-local')} variant="secondary" className="!w-full !text-sm" disabled={isProcessing}>
          {t('conflict_modal_keep_local_button')}
        </Button>
        <Button onClick={() => onResolve(conflict.id, 'use-cloud')} variant="secondary" className="!w-full !text-sm" disabled={isProcessing}>
          {t('conflict_modal_use_cloud_button')}
        </Button>
      </div>
    </div>
  );
};

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({ conflicts, onResolve, onClose }) => {
  const { t } = useLanguage();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleResolve = async (projectId: string, resolution: 'keep-local' | 'use-cloud') => {
    setProcessingId(projectId);
    try {
      await onResolve(projectId, resolution);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-11/12 max-w-lg m-4 flex flex-col max-h-[90vh]"
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 id="conflict-modal-title" className="text-xl font-bold text-gray-800">{t('conflict_modal_title')}</h2>
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

        <main className="p-6 flex-grow overflow-y-auto space-y-4">
          <p className="text-sm text-slate-600">{t('conflict_modal_message')}</p>
          {conflicts.map(conflict => (
            <ConflictItem
              key={conflict.id}
              conflict={conflict}
              onResolve={handleResolve}
              isProcessing={processingId === conflict.id}
            />
          ))}
        </main>
      </div>
    </div>
  );
};