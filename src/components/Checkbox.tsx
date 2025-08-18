import React from 'react';

interface CheckboxProps {
  id?: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  checked,
  onChange,
  className = '',
  labelClassName = 'ml-2 text-sm text-gray-700',
  inputClassName = 'h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500',
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={inputClassName}
      />
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
    </div>
  );
};

export default Checkbox;