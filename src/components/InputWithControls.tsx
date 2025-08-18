import React, { useRef, useCallback } from 'react';

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const MinusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
    </svg>
);

interface InputWithControlsProps {
  id?: string;
  name?: string;
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onLabelClick?: (target: HTMLElement) => void;
  min?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
}

const InputWithControls: React.FC<InputWithControlsProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  onIncrement,
  onDecrement,
  onLabelClick,
  min = 0,
  step = 1,
  className = '',
  inputClassName = ''
}) => {
  const repeatingTimeoutRef = useRef<number | null>(null);
  const initialPressTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isTouchHandled = useRef(false);

  const stopChangingValue = useCallback(() => {
    if (initialPressTimeoutRef.current) {
      clearTimeout(initialPressTimeoutRef.current);
      initialPressTimeoutRef.current = null;
    }
    if (repeatingTimeoutRef.current) {
      clearTimeout(repeatingTimeoutRef.current);
      repeatingTimeoutRef.current = null;
    }
  }, []);

  const startRepeating = useCallback((action: 'increment' | 'decrement') => {
    const changeFn = action === 'increment' ? onIncrement : onDecrement;
    let delay = 150;
    let stepCount = 0;

    const changeAndSchedule = () => {
      // Use ref to get the live value from the DOM to avoid stale state in closure
      if (action === 'decrement' && inputRef.current) {
        const currentValue = Number(inputRef.current.value);
        if (currentValue <= min) {
          stopChangingValue();
          return;
        }
      }

      changeFn();
      stepCount++;
      if (stepCount > 5) {
        delay = Math.max(30, delay * 0.9);
      }
      repeatingTimeoutRef.current = window.setTimeout(changeAndSchedule, delay);
    };

    changeAndSchedule();
  }, [onIncrement, onDecrement, min, stopChangingValue]);

  const handlePressStart = useCallback((action: 'increment' | 'decrement') => {
    const changeFn = action === 'increment' ? onIncrement : onDecrement;
    changeFn();

    initialPressTimeoutRef.current = window.setTimeout(() => {
      startRepeating(action);
    }, 400);
  }, [onIncrement, onDecrement, startRepeating]);

  const handleTouchStartWrapper = (e: React.TouchEvent, action: 'increment' | 'decrement') => {
    e.preventDefault();
    isTouchHandled.current = true;
    handlePressStart(action);
  };

  const handleMouseDownWrapper = (e: React.MouseEvent, action: 'increment' | 'decrement') => {
    if (isTouchHandled.current) {
      return;
    }
    handlePressStart(action);
  };

  const handleInteractionEnd = () => {
    stopChangingValue();
    // Use a timeout to reset the flag, allowing any lingering synthetic mouse events to be ignored.
    setTimeout(() => {
      isTouchHandled.current = false;
    }, 50);
  };

  return (
    <div className={`mb-1 ${className}`}>
        <label 
            htmlFor={id} 
            className={`block text-sm font-medium text-gray-700 mb-1 ${onLabelClick ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
            onClick={onLabelClick ? (e) => { e.preventDefault(); onLabelClick(e.currentTarget); } : undefined}
        >
            {label}
        </label>
        <div className="flex items-end w-full">
            <button
                type="button"
                onMouseDown={(e) => handleMouseDownWrapper(e, 'decrement')}
                onMouseUp={handleInteractionEnd}
                onMouseLeave={handleInteractionEnd}
                onTouchStart={(e) => handleTouchStartWrapper(e, 'decrement')}
                onTouchEnd={handleInteractionEnd}
                onTouchCancel={handleInteractionEnd}
                disabled={Number(value) <= min}
                className="h-9 px-1.5 text-sm leading-none rounded-l-md border border-r-0 border-gray-300 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed flex items-center justify-center"
                title={`Уменьшить`}
            >
                <MinusIcon />
            </button>
            <input
                ref={inputRef}
                id={id}
                name={name}
                type="number"
                value={value}
                onChange={onChange}
                min={min}
                step={step}
                className={`h-9 w-full text-center rounded-none !mt-0 border-t border-b border-gray-300 bg-gray-50 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm ${inputClassName}`}
            />
            <button
                type="button"
                onMouseDown={(e) => handleMouseDownWrapper(e, 'increment')}
                onMouseUp={handleInteractionEnd}
                onMouseLeave={handleInteractionEnd}
                onTouchStart={(e) => handleTouchStartWrapper(e, 'increment')}
                onTouchEnd={handleInteractionEnd}
                onTouchCancel={handleInteractionEnd}
                className="h-9 px-1.5 text-sm leading-none rounded-r-md border border-l-0 border-gray-300 bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                title={`Увеличить`}
            >
                <PlusIcon />
            </button>
        </div>
    </div>
  );
};

export default InputWithControls;