import React, { forwardRef } from 'react';

interface InputProps {
  id?: string;
  name?: string; // Added name prop
  label?: string;
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // Made onChange optional
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void; // Added onBlur prop
  type?: 'text' | 'number';
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  error?: string;
  warning?: string;
  isSuccess?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean; // Added disabled prop
  readOnly?: boolean; // Added readOnly prop
  title?: string; // Added title prop
  onLabelClick?: (target: HTMLElement) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  className = '',
  labelClassName = 'block text-sm font-medium text-gray-700 mb-1',
  inputClassName = 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
  error,
  warning,
  isSuccess,
  required,
  min,
  max,
  step,
  disabled,
  readOnly,
  title,
  onLabelClick
}, ref) => {
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;

    const originalValue = e.target.value;
    let valueToUse = originalValue;

    if (type === 'number' && min !== undefined && min >= 0) {
      if (originalValue.includes('-')) {
        valueToUse = originalValue.replace(/-/g, '');
      }
    }

    if (valueToUse !== originalValue) {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: valueToUse },
        currentTarget: { ...e.currentTarget, value: valueToUse },
      };
      onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
    } else {
      onChange(e);
    }
  };
  
  const borderClass = error 
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
    : warning 
    ? 'border-amber-500 focus:ring-amber-500 focus:border-amber-500' 
    : isSuccess 
    ? 'border-green-500 focus:ring-green-500 focus:border-green-500' 
    : '';

  return (
    <div className={`mb-4 ${className}`}>
      {label && <label htmlFor={id} className={`${labelClassName} ${onLabelClick ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`} onClick={onLabelClick ? (e) => onLabelClick(e.currentTarget) : undefined}>{label}{required && <span className="text-red-500">*</span>}</label>}
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={handleOnChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`${inputClassName} ${borderClass} transition-colors duration-300 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${readOnly ? 'bg-gray-100' : 'bg-gray-50'}`}
        required={required}
        min={type === 'number' ? min : undefined}
        max={type === 'number' ? max : undefined}
        step={type === 'number' ? step : undefined}
        disabled={disabled}
        readOnly={readOnly}
        title={error || warning || title}
      />
      {error && <p className="mt-1 text-xs text-red-600 font-semibold">{error}</p>}
      {!error && warning && <p className="mt-1 text-xs text-amber-700 font-semibold">{warning}</p>}
    </div>
  );
});

export default Input;