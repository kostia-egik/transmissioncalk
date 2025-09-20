import React from 'react';
import { InfoIcon } from '../../assets/icons/InfoIcon';
import { FolderIcon } from '../../assets/icons/FolderIcon';

const EraserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-6 h-6" fill="currentColor">
      <path d="M8.1 14l6.4-7.2c0.6-0.7 0.6-1.8-0.1-2.5l-2.7-2.7c-0.3-0.4-0.8-0.6-1.3-0.6h-1.8c-0.5 0-1 0.2-1.4 0.6l-6.7 7.6c-0.6 0.7-0.6 1.9 0.1 2.5l2.7 2.7c0.3 0.4 0.8 0.6 1.3 0.6h11.4v-1h-7.9zM6.8 13.9c0 0 0-0.1 0 0l-2.7-2.7c-0.4-0.4-0.4-0.9 0-1.3l3.4-3.9h-1l-3 3.3c-0.6 0.7-0.6 1.7 0.1 2.4l2.3 2.3h-1.3c-0.2 0-0.4-0.1-0.6-0.2l-2.8-2.8c-0.3-0.3-0.3-0.8 0-1.1l3.5-3.9h1.8l3.5-4h1l-3.5 4 3.1 3.7-3.5 4c-0.1 0.1-0.2 0.1-0.3 0.2z"></path>
    </svg>
);

const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);


interface SchemeBuilderHeaderProps {
    onBack: () => void;
    onOpenInfoModal: () => void;
    onResetScheme: () => void;
    onOpenProjectModal: () => void;
}

export const SchemeBuilderHeader: React.FC<SchemeBuilderHeaderProps> = ({ onBack, onOpenInfoModal, onResetScheme, onOpenProjectModal }) => {
    const buttonClass = "p-2 bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-300 rounded-full shadow-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500";

    return (
        <>
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center space-x-2">
                <button
                    id="back-to-workbench-btn"
                    onClick={onBack} 
                    className={buttonClass}
                    title="Назад к расчетам"
                    aria-label="Назад к расчетам"
                >
                    <BackArrowIcon />
                </button>
                <span className="text-sm font-semibold text-gray-700 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow">Сборщик схем</span>
            </div>
            <div id="scheme-header-controls" className="absolute top-2.5 right-2.5 z-20 flex flex-col space-y-2">
                <button onClick={onOpenInfoModal} className={buttonClass} title="Справка" aria-label="Справка">
                    <InfoIcon />
                </button>
                <button onClick={onResetScheme} className={buttonClass} title="Сбросить схему к исходной" aria-label="Сбросить схему">
                    <EraserIcon />
                </button>
                <button
                    onClick={onOpenProjectModal}
                    className={buttonClass}
                    title="Проект и Экспорт"
                    aria-label="Проект и Экспорт"
                >
                    <FolderIcon />
                </button>
            </div>
        </>
    );
};