import { useEffect, useState } from "react";

type Props = {
  className?: string;
  minValue: number;
  maxValue: number;
  value: number;
  onChange(value: number): void;
}

function NumericRangeInput({minValue, maxValue, value, onChange, className}: Props) {
  const [inputValue, setInputValue] = useState<string>(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  function _textToValidNumber(text: string): number {
    try {
      const number = Number(text);
      if (number < minValue) return minValue;
      return (number > maxValue) ? maxValue : number;
    } catch (error) {
      return minValue;
    }
  }

  return (
    <input 
      type='text' 
      value={inputValue} 
      className={className}
      onChange={(event) => setInputValue(event.target.value)}
      onBlur={(event) => onChange(_textToValidNumber(event.target.value))} 
    />
  );
}

export default NumericRangeInput;