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
}) => {
  const customInputRef = useRef<HTMLInputElement>(null);

  // State to control the visibility of the custom input field.
  // Initial state calculation: show if value is present but not a standard option.
  const [showCustomInput, setShowCustomInput] = useState(() => 
    value !== '' && !options.includes(Number(value))
  );

  // Effect to focus the custom input when it becomes visible.
  useEffect(() => {
    if (showCustomInput) {
      setTimeout(() => customInputRef.current?.focus(), 0);
    }
  }, [showCustomInput]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === CUSTOM_VALUE) {
      setShowCustomInput(true);
      onChange(''); // Clear value to prompt for new input.
    } else {
      setShowCustomInput(false);
      onChange(Number(selectedValue));
    }
  };
  
  const handleCustomInputBlur = () => {
    // When the input loses focus, check if the entered value is a standard one.
    const numericValue = Number(value);
    if (value !== '' && options.includes(numericValue)) {
      // If it is, hide the custom input. The select will update automatically.
      setShowCustomInput(false);
    }
  };

  const selectOptions = [
    ...options.map(opt => ({ value: String(opt), label: String(opt) })),
    { value: CUSTOM_VALUE, label: 'свое значение' }
  ];
  
  // If a custom value is active, the select should show the custom value label.
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
        className="mb-0" // Override default margin of Select component wrapper
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
          inputClassName={`mt-2 bg-gray-50 ${inputClassName}`} // Add margin-top to separate from select
          className="mb-0" // No margin on the Input wrapper itself
          label="" // No label for the custom input field
          min={min}
        />
      )}
    </div>
  );
};