import React from 'react';
import Input from './Input';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  allowEmpty?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = 1,
  max,
  allowEmpty = false,
  label,
  error,
  helperText,
  ...props
}) => {
  // Convert number to string for internal state
  const [internalValue, setInternalValue] = React.useState(value.toString());

  // Update internal value when external value changes
  React.useEffect(() => {
    setInternalValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setInternalValue(inputValue);
    
    if (inputValue === '') {
      if (allowEmpty) {
        onChange(0);
      }
      return;
    }

    // Remove leading zeros
    const cleanValue = inputValue.replace(/^0+/, '') || '0';
    const numValue = parseInt(cleanValue);

    if (!isNaN(numValue)) {
      let finalValue = numValue;
      
      // Apply min/max constraints
      if (min !== undefined) {
        finalValue = Math.max(min, finalValue);
      }
      if (max !== undefined) {
        finalValue = Math.min(max, finalValue);
      }
      
      onChange(finalValue);
    }
  };

  const handleBlur = () => {
    // On blur, ensure the displayed value matches the actual number value
    setInternalValue(value.toString());
  };

  return (
    <Input
      type="number"
      inputMode="numeric"
      pattern="[0-9]*"
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      min={min}
      max={max}
      label={label}
      error={error}
      helperText={helperText}
      {...props}
    />
  );
};

export default NumberInput;
