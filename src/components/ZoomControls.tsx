import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const ZoomInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
  </svg>
);

const FitScreenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
);

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ onZoomIn, onZoomOut, onFitScreen }) => {
  const { t } = useLanguage();
  const buttonClass = "p-2 bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-300 rounded-full shadow-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div id="zoom-controls" className="absolute bottom-4 right-4 z-20 flex flex-col space-y-2">
      <button onClick={onZoomIn} className={buttonClass} title={t('zoom_controls_zoom_in_tooltip')} aria-label={t('zoom_controls_zoom_in_aria_label')}>
        <ZoomInIcon />
      </button>
      <button onClick={onZoomOut} className={buttonClass} title={t('zoom_controls_zoom_out_tooltip')} aria-label={t('zoom_controls_zoom_out_aria_label')}>
        <ZoomOutIcon />
      </button>
      <button onClick={onFitScreen} className={buttonClass} title={t('zoom_controls_fit_screen_tooltip')} aria-label={t('zoom_controls_fit_screen_aria_label')}>
        <FitScreenIcon />
      </button>
    </div>
  );
};

export default ZoomControls;