import React, { useState, useEffect, useRef } from 'react';
import Input from './Input';
import Select from './Select';

interface SelectOrInputProps {
  label: string;
  options: number[];
  value: string | number;
  onChange: (value: string | number) => void;
  onLabelClick?: (target: HTMLElement) => void;
  id?: string;
  inputClassName?: string;
  selectClassName?: string;
  min?: number;
  error?: string;
  warning?: string;
  isSuccess?: boolean;
}

const CUSTOM_VALUE = 'custom';

export const SelectOrInput: React.FC<SelectOrInputProps> = ({
  label,
  options,
  value,
  onChange,
  onLabelClick,
  id,
  inputClassName = '',
  selectClassName = '',
  min,
  error,
  warning,
  isSuccess,
}) => {
  const customInputRef = useRef<HTMLInputElement>(null);

  const [showCustomInput, setShowCustomInput] = useState(() => 
    value !== '' && !options.includes(Number(value))
  );

  useEffect(() => {
    if (showCustomInput) {
      setTimeout(() => customInputRef.current?.focus(), 0);
    }
  }, [showCustomInput]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === CUSTOM_VALUE) {
      setShowCustomInput(true);
      onChange('');
    } else {
      setShowCustomInput(false);
      onChange(Number(selectedValue));
    }
  };
  
  const handleCustomInputBlur = () => {
    const numericValue = Number(value);
    if (value !== '' && options.includes(numericValue)) {
      setShowCustomInput(false);
    }
  };

  const selectOptions = [
    ...options.map(opt => ({ value: String(opt), label: String(opt) })),
    { value: CUSTOM_VALUE, label: 'свое значение' }
  ];
  
  const selectValue = showCustomInput ? CUSTOM_VALUE : String(value);

  return (
    <div className="mb-1">
      <Select
        id={id}
        label={label}
        value={selectValue}
        onChange={handleSelectChange}
        onLabelClick={onLabelClick}
        options={selectOptions}
        selectClassName={`bg-gray-50 ${selectClassName}`}
        className="mb-0"
        error={showCustomInput ? undefined : error}
        warning={showCustomInput ? undefined : warning}
        isSuccess={showCustomInput ? undefined : isSuccess}
      />
      {showCustomInput && (
        <Input
          ref={customInputRef}
          id={`${id}-custom`}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleCustomInputBlur}
          placeholder="Введите значение"
          inputClassName={`mt-2 bg-gray-50 ${inputClassName}`}
          className="mb-0"
          label=""
          min={min}
          error={error}
          warning={warning}
          isSuccess={isSuccess}
        />
      )}
    </div>
  );
};