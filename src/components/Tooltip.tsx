import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { TooltipContent } from '../tooltip-data';

interface TooltipProps {
  content: TooltipContent;
  targetRect: DOMRect;
  onClose: () => void;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, targetRect, onClose }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    if (targetRect && tooltipRef.current) {
      const { width: tooltipWidth, height: tooltipHeight } = tooltipRef.current.getBoundingClientRect();
      const { innerWidth: vw, innerHeight: vh } = window;
      const margin = 10;

      let top = targetRect.bottom + margin;
      let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);

      // Adjust if it overflows the viewport
      if (left < margin) left = margin;
      if (left + tooltipWidth > vw - margin) left = vw - margin - tooltipWidth;
      if (top + tooltipHeight > vh - margin) {
          top = targetRect.top - tooltipHeight - margin;
      }
      if (top < margin) top = margin;


      setPosition({ top, left });
      setIsVisible(true);
    }
  }, [targetRect, content]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const portalRoot = document.getElementById('root');
  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onTouchStart={onClose} />
      <div
        ref={tooltipRef}
        style={{ ...position }}
        className={`fixed z-50 w-64 p-3 bg-gray-800 text-white rounded-lg shadow-xl transition-opacity duration-200 ${isVisible ? 'opacity-100 animate-fade-in' : 'opacity-0'}`}
        role="tooltip"
        onClick={e => e.stopPropagation()}
      >
        <h4 className="font-bold text-base mb-1">{content.title}{content.unit && <span className="text-sm font-normal text-gray-400 ml-1">[{content.unit}]</span>}</h4>
        <p className="text-sm text-gray-200">{content.description}</p>
      </div>
    </>,
    portalRoot
  );
};