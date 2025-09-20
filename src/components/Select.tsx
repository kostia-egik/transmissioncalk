import React from 'react';

interface SelectProps<T extends string | number> {
  id?: string;
  name?: string; // Added name prop
  label?: React.ReactNode;
  value: T;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: T; label: string }[];
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  error?: string;
  warning?: string;
  isSuccess?: boolean;
  required?: boolean;
  emptyOptionLabel?: string;
  disabled?: boolean; // Added disabled prop
  onLabelClick?: (target: HTMLElement) => void;
}

const Select = <T extends string | number,>(
  {
    id,
    name,
    label,
    value,
    onChange,
    options,
    className = '',
    labelClassName = 'block text-sm font-medium text-gray-700 mb-1',
    selectClassName = 'mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md',
    error,
    warning,
    isSuccess,
    required,
    emptyOptionLabel,
    disabled,
    onLabelClick
  }: SelectProps<T>
): React.ReactElement => {
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
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`${selectClassName} ${borderClass} transition-colors duration-300 ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'}`}
        required={required}
        disabled={disabled}
      >
        {emptyOptionLabel && <option value="">{emptyOptionLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 font-semibold">{error}</p>}
      {!error && warning && <p className="mt-1 text-xs text-amber-700 font-semibold">{warning}</p>}
    </div>
  );
};

export default Select;