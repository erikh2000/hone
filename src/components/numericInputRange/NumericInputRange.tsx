import NumericInput from "../numericInput/NumericInput";

// TODO - refactor to sl-react-ui.

type Props = {
  minValue: number;
  maxValue: number;
  leftValue: number;
  rightValue: number;
  allowSameValues?: boolean;
  className?: string;
  innerText?: string;
  digitWidth?: number;
  onChange(leftValue:number, rightValue:number): void;
}

function NumericInputRange({minValue, maxValue, leftValue, rightValue, onChange, className, innerText, allowSameValues, digitWidth}: Props) {
  const toText = innerText ?? 'to';
  const rightMin = allowSameValues ? leftValue : leftValue + 1;
  const leftMax = allowSameValues ? rightValue : rightValue - 1;

  return (
    <div className={className}>
      <NumericInput className={className} minValue={minValue} maxValue={leftMax} value={leftValue} digitWidth={digitWidth}
        onChange={(nextLeftValue) => onChange(nextLeftValue, rightValue)} />
      <span>&nbsp;{toText}&nbsp;</span>
      <NumericInput className={className} minValue={rightMin} maxValue={maxValue} value={rightValue} digitWidth={digitWidth}
        onChange={(nextRightValue) => onChange(leftValue, nextRightValue)} />
    </div>
  );
}

export default NumericInputRange;