import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { SelectOption } from '../types';

interface Props<T extends string> {
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange(value: T): void;
  disabled?: boolean;
}
export function CustomSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: Props<T>) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const search = useRef({ text: '', time: 0 });
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [position, setPosition] = useState<CSSProperties>({});
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const choose = (index: number) => {
    onChange(options[index].value);
    setOpen(false);
  };
  const show = () => {
    if (!disabled) {
      setHighlighted(selected);
      setOpen(true);
    }
  };

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const height = Math.min(options.length * 48 + 10, 250);
      setPosition({
        width: Math.min(rect.width, innerWidth - 24),
        left: Math.max(12, Math.min(rect.left, innerWidth - rect.width - 12)),
        top:
          innerHeight - rect.bottom >= height + 8
            ? rect.bottom + 7
            : Math.max(8, rect.top - height - 7),
        maxHeight: Math.min(height, innerHeight - 24),
      });
    };
    place();
    const dismiss = () => setOpen(false);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', dismiss);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [open, options.length]);
  useLayoutEffect(() => {
    if (open)
      optionRefs.current[highlighted]?.scrollIntoView({ block: 'nearest' });
  }, [open, highlighted]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (
        !buttonRef.current?.contains(event.target as Node) &&
        !listRef.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const { key } = event;
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) {
      event.preventDefault();
      if (!open) {
        show();
        if (key === 'Home') setHighlighted(0);
        if (key === 'End') setHighlighted(options.length - 1);
        return;
      }
      if (key === 'Enter' || key === ' ') choose(highlighted);
      else if (key === 'Home') setHighlighted(0);
      else if (key === 'End') setHighlighted(options.length - 1);
      else
        setHighlighted(
          (current) =>
            (current + (key === 'ArrowDown' ? 1 : options.length - 1)) %
            options.length,
        );
    } else if (key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (key === 'Tab' && open) choose(highlighted);
    else if (
      key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      const now = Date.now();
      search.current.text =
        now - search.current.time > 700 ? key : search.current.text + key;
      search.current.time = now;
      const index = options.findIndex((option) =>
        option.label
          .toLocaleLowerCase('ru')
          .startsWith(search.current.text.toLocaleLowerCase('ru')),
      );
      if (!open) show();
      if (index >= 0) setHighlighted(index);
    }
  }
  const content = (option: SelectOption<T>) => (
    <span className="select-option-content">
      {option.color && (
        <i style={{ backgroundColor: option.color }} aria-hidden="true" />
      )}
      <span>{option.label}</span>
    </span>
  );
  return (
    <>
      <label
        className="control-label"
        id={`${id}-label`}
        htmlFor={`${id}-button`}
      >
        {label}
      </label>
      <button
        ref={buttonRef}
        id={`${id}-button`}
        type="button"
        className="select-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-activedescendant={open ? `${id}-option-${highlighted}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
      >
        <span className="select-value" id={`${id}-value`}>
          {content(options[selected])}
        </span>
        <span className="select-arrow" aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            ref={listRef}
            id={`${id}-list`}
            className="select-list"
            role="listbox"
            aria-labelledby={`${id}-label`}
            style={position}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                id={`${id}-option-${index}`}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="option"
                aria-selected={option.value === value}
                className={`select-option${index === highlighted ? ' highlighted' : ''}`}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  choose(index);
                  buttonRef.current?.focus({ preventScroll: true });
                }}
              >
                {content(option)}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
