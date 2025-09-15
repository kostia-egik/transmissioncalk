import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { SpacerShaft, SpacerStyle } from '../types';

interface SpacerContextMenuProps {
    spacer: SpacerShaft & { index: number }; position: { x: number; y: number }; onClose: () => void;
    onUpdate: (index: number, newProps: Partial<SpacerShaft>) => void; onDelete: (index: number) => void;
    currentIndex: number | null; totalItems: number; onNavigate: (direction: 'next' | 'prev') => void;
    isMobileView: boolean;
}
  
export const SpacerContextMenu: React.FC<SpacerContextMenuProps> = ({ spacer, position, onClose, onUpdate, onDelete, currentIndex, totalItems, onNavigate, isMobileView }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [length, setLength] = useState(spacer.length);

    useEffect(() => {
        setLength(spacer.length);
    }, [spacer.length]);
  
    useLayoutEffect(() => {
        if (isMobileView || !menuRef.current) return;

        const menu = menuRef.current;
        const { innerWidth, innerHeight } = window;
        const { width, height } = menu.getBoundingClientRect();
        let left = position.x;
        let top = position.y;
        if (left + width > innerWidth - 10) { left = position.x - width - 20; }
        if (top + height > innerHeight - 10) { top = position.y - height - 20; }
        menu.style.left = `${Math.max(5, left)}px`;
        menu.style.top = `${Math.max(5, top)}px`;
    }, [position, isMobileView]);
  
    const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => { const newLength = parseInt(e.target.value, 10); setLength(newLength); onUpdate(spacer.index, { length: newLength }); };
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const value = e.target.value; if (value === 'delete') { onDelete(spacer.index); } else { onUpdate(spacer.index, { style: value as SpacerStyle }); } };

    const mobileClasses = "bottom-4 left-4 right-4 w-auto animate-slide-up";
    const desktopClasses = "w-64";

    return ( 
        <> 
            <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose}></div> 
            <div 
                ref={menuRef} 
                className={`fixed bg-white rounded-xl shadow-2xl z-50 border border-gray-200 ${isMobileView ? mobileClasses : desktopClasses}`}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            > 
                <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => onNavigate('prev')} title="Предыдущий (←)" className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-xs font-mono text-gray-500 tabular-nums">
                            {currentIndex !== null ? `${currentIndex + 1} / ${totalItems}` : '-/-'}
                        </span>
                        <button onClick={() => onNavigate('next')} title="Следующий (→)" className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <button onClick={onClose} title="Закрыть (Esc)" className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-3 border-b border-gray-200"> <h3 className="font-bold text-gray-800 text-center">Настройки Вала-проставки</h3> </div> 
                <div className="p-3 space-y-4"> <div> <label htmlFor={`length-slider-${spacer.id}`} className="flex justify-between text-sm font-medium text-gray-700 mb-1"> <span>Длина</span> <span className="font-semibold text-gray-800">{length}px</span> </label> <input id={`length-slider-${spacer.id}`} type="range" min="15" max="500" step="5" value={length} onChange={handleLengthChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" /> </div> <div> <label htmlFor={`actions-${spacer.id}`} className="block text-sm font-medium text-gray-700 mb-2">Действия</label> <select id={`actions-${spacer.id}`} value={spacer.style} onChange={handleSelectChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"> <option value="solid">Стиль: Сплошной</option> <option value="dashed">Стиль: Штриховой</option> <option value="cardan">Стиль: Карданный</option> <option value="delete" className="!text-red-600 !font-semibold">Удалить вал</option> </select> </div> </div> 
            </div> 
        </> 
    );
};