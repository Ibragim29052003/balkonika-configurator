import { useId } from 'react';
import type { ReactNode } from 'react';
export function Toggle({
  label,
  hint,
  checked,
  onChange,
  id,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange(value: boolean): void;
  id?: string;
}) {
  return (
    <label className="toggle">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}
export function Range({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: '%' | 'см';
  onChange(value: number): void;
}) {
  const id = useId();
  return (
    <>
      <label className="control-label range-label" htmlFor={id}>
        {label}
        <output htmlFor={id}>
          {value}
          {unit === '%' ? '%' : ' см'}
        </output>
      </label>
      <input
        id={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-valuetext={`${value} ${unit === '%' ? 'процентов' : 'сантиметров'}`}
        onChange={(event) => onChange(event.target.valueAsNumber)}
      />
      {unit === 'см' && (
        <div className="range-ends">
          <span>Короче · 120 см</span>
          <span>В пол · 260 см</span>
        </div>
      )}
    </>
  );
}
export function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: readonly { value: T; label: ReactNode }[];
  onChange(value: T): void;
}) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
