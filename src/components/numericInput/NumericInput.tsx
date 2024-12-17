import { useEffect, useState, CSSProperties } from "react";

// TODO - refactor to sl-react-ui.

type Props = {
  className?: string;
  minValue: number;
  maxValue: number;
  digitWidth?: number;
  allowDecimals?: boolean;
  value: number;
  onChange(value:number): void;  // Guaranteed to only return valid numbers between minValue and maxValue.
}

// Allow for digits, minus sign, and decimal point. Strip out all other characters.
function _stripNonNumeric(text: string): string {
  return text.replace(/[^0-9.-]/g, '');
}

// Return number of digits in a number.
function getDigitCount(value: number): number {
  if (value === 0) return 1;
  let digitCount = Math.floor(Math.log10(Math.abs(value))) + 1;
  if (value < 0) digitCount++; // Account for minus sign.
  return digitCount;
}

function _createDigitWidthStyle(minValue:number, maxValue:number, digitWidth?:number):CSSProperties {
  let digitCount = digitWidth ?? Math.max(getDigitCount(minValue), getDigitCount(maxValue));
  if (!digitCount) return {};
  return {width: `calc(${digitCount}ch + 1vh)`};
}

function NumericInput({minValue, maxValue, value, onChange, className, allowDecimals, digitWidth}: Props) {
  const [inputValue, setInputValue] = useState<string>(value.toString());
  const [digitWidthStyle, setDigitWidthStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (value < minValue || value > maxValue) throw Error('Unexpected'); // Caller error: supplying a value outside the range.
    setInputValue(value.toString());
  }, [value]);

  useEffect(() => {
    const nextDigitWidthStyle:CSSProperties = _createDigitWidthStyle(minValue, maxValue, digitWidth);
    setDigitWidthStyle(nextDigitWidthStyle);
  }, [digitWidth]);

  function _textToValidNumber(text: string): number {
    try {
      let number = Number(text);
      if (isNaN(number)) text = _stripNonNumeric(text); // Salvage the intent of something like "45x", if possible.
      number = Number(text);
      if (!allowDecimals) number = Math.round(number);
      if (number < minValue || isNaN(number)) return minValue;
      return (number > maxValue) ? maxValue : number;
    } catch (error) {
      return minValue;
    }
  }

  function _handleChange(text:string) {
    setInputValue(text); // Always need to update text even if it's invalid, because that's how typing works.
    const number = _textToValidNumber(text);
    if ('' + number === text) onChange(number); // But if the new value is valid, let the caller use it without waiting for blur.
  }

  function _handleBlur(text:string) {
    const number = _textToValidNumber(text);
    if ('' + number !== text) setInputValue(number.toString());
    onChange(number);
  }

  return (
    <input 
      type='text' value={inputValue} style={digitWidthStyle} className={className} 
      onChange={(event) => _handleChange(event.target.value)} onBlur={(event) => _handleBlur(event.target.value)} 
    />
  );
}

export default NumericInput;