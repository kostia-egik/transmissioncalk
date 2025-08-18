import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';

// Icon for the dropdown arrow
const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

interface CustomSelectOption<T extends string | number> {
  value: T;
  label: string;
  previewComponent: React.ReactNode;
}

interface CustomSelectProps<T extends string | number> {
  id?: string;
  name?: string;
  label?: string;
  value: T;
  onChange: (value: T) => void;
  onLabelClick?: (target: HTMLElement) => void;
  options: CustomSelectOption<T>[];
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  emptyOptionLabel?: string;
  disabled?: boolean;
}

const PreviewPopup: React.FC<{ content: React.ReactNode; position: { top: number; left: number } }> = ({ content, position }) => {
    if (!content) return null;

    const portalRoot = document.getElementById('root');
    if (!portalRoot) return null;

    return ReactDOM.createPortal(
        <div 
            className="fixed z-[101] p-2 bg-white rounded-lg shadow-2xl border border-gray-200 pointer-events-none transition-opacity duration-200 animate-fade-in"
            style={{ top: position.top, left: position.left }}
        >
            {content}
        </div>,
        portalRoot
    );
};


export const CustomSelect = <T extends string | number>({
  id,
  name,
  label,
  value,
  onChange,
  onLabelClick,
  options,
  className = '',
  labelClassName = 'block text-sm font-medium text-gray-700 mb-1',
  selectClassName = '',
  emptyOptionLabel = '-- Выбрать --',
  disabled = false,
}: CustomSelectProps<T>): React.ReactElement => {
    const [isOpen, setIsOpen] = useState(false);
    const [preview, setPreview] = useState<React.ReactNode | null>(null);
    const [previewPosition, setPreviewPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [listPosition, setListPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
    const [showConfirmedPreview, setShowConfirmedPreview] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const [preselectedValue, setPreselectedValue] = useState<T | null>(null);
    
    const handleToggle = () => !disabled && setIsOpen(!isOpen);

    const handleSelect = (selectedValue: T) => {
        onChange(selectedValue);
        setIsOpen(false);
        const selectedOption = options.find(opt => opt.value === selectedValue);
        if (selectedOption?.previewComponent) {
            setPreview(selectedOption.previewComponent);
            setShowConfirmedPreview(true);
            setTimeout(() => {
                setShowConfirmedPreview(false);
                setPreview(null);
            }, 1000);
        }
    };

    const handleOptionClick = (optionValue: T) => {
        if (isTouchDevice) {
            if (preselectedValue === optionValue) {
                // Second tap: confirm selection
                handleSelect(optionValue);
                setPreselectedValue(null);
            } else {
                // First tap: pre-select and show preview
                setPreselectedValue(optionValue);
                const option = options.find(opt => opt.value === optionValue);
                setPreview(option?.previewComponent ?? null);
            }
        } else {
            // Desktop click
            handleSelect(optionValue);
        }
    };
    
    const handleOptionHover = (optionValue: T) => {
        if (!isTouchDevice) {
            const option = options.find(opt => opt.value === optionValue);
            setPreview(option?.previewComponent ?? null);
        }
    };

    const handleMouseLeaveList = () => {
        if (!isTouchDevice) {
            setPreview(null);
        }
    };
    
    useLayoutEffect(() => {
        if ((isOpen || showConfirmedPreview) && triggerRef.current && (preview || isOpen)) {
            const rect = triggerRef.current.getBoundingClientRect();

            if (isOpen) {
                 setListPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
            }

            if (preview) {
                const popupWidth = 100 + 16; // 100px UGO + 16px padding
                let popupLeft = rect.right + 10;
                let popupTop = rect.top;
                
                if (popupLeft + popupWidth > window.innerWidth) {
                    popupLeft = rect.left - popupWidth - 10;
                }
                if (popupTop < 0) popupTop = 5;
                if (popupTop + 116 > window.innerHeight) popupTop = window.innerHeight - 116 - 5;


                setPreviewPosition({ top: popupTop, left: popupLeft });
            }
        }
    }, [isOpen, showConfirmedPreview, preview]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current && !containerRef.current.contains(event.target as Node) &&
                listRef.current && !listRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setPreview(null);
                setPreselectedValue(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const selectedLabel = options.find(opt => opt.value === value)?.label || emptyOptionLabel;
    const portalRoot = document.getElementById('root');

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label htmlFor={id} className={`${labelClassName} ${onLabelClick ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`} onClick={onLabelClick ? (e) => onLabelClick(e.currentTarget) : undefined}>{label}</label>}
            <button
                ref={triggerRef}
                id={id}
                name={name}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`mt-1 relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6 ${selectClassName} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="block truncate">{selectedLabel}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                    <ChevronDownIcon />
                </span>
            </button>

            {isOpen && portalRoot && ReactDOM.createPortal(
                <ul
                    ref={listRef}
                    className="z-[100] mt-1 max-h-56 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                    style={{
                        position: 'absolute',
                        top: `${listPosition.top}px`,
                        left: `${listPosition.left}px`,
                        width: `${listPosition.width}px`,
                    }}
                    role="listbox"
                    onMouseLeave={handleMouseLeaveList}
                >
                    {options.map((option) => (
                        <li
                            key={String(option.value)}
                            className={`relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white ${isTouchDevice && preselectedValue === option.value ? 'bg-indigo-200' : ''}`}
                            role="option"
                            aria-selected={value === option.value}
                            onClick={() => handleOptionClick(option.value)}
                            onMouseEnter={() => handleOptionHover(option.value)}
                        >
                            <span className={`block truncate ${value === option.value ? 'font-semibold' : 'font-normal'}`}>
                                {option.label}
                            </span>
                        </li>
                    ))}
                </ul>,
                portalRoot
            )}
            
             <PreviewPopup content={preview} position={previewPosition} />
        </div>
    );
};
