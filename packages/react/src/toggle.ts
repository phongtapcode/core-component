import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { HTMLAttributes } from 'react';
import type { UiToggle } from '@element-works/components';
import { register } from './register.js';

export interface ToggleProps extends Omit<HTMLAttributes<UiToggle>, 'onChange'> {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean, event: CustomEvent<{ checked: boolean }>) => void;
}

export const Toggle = forwardRef<UiToggle, ToggleProps>(function Toggle(
  { label, checked, defaultChecked, disabled, onCheckedChange, ...reactProps }, forwardedRef,
) {
  const elementRef = useRef<UiToggle>(null);
  const initialized = useRef(false);
  useImperativeHandle(forwardedRef, () => elementRef.current!, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<{ checked: boolean }>;
      onCheckedChange?.(customEvent.detail.checked, customEvent);
    };
    element.addEventListener('ui-toggle-change', listener);
    return () => element.removeEventListener('ui-toggle-change', listener);
  }, [onCheckedChange]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    let active = true;
    void register('ui-toggle').then(() => {
      if (!active) return;
      if (label === undefined) element.removeAttribute('label');
      else element.setAttribute('label', label);
      if (checked !== undefined) element.$set('checked', checked);
      else if (!initialized.current && defaultChecked !== undefined) element.$set('checked', defaultChecked);
      element.$set('disabled', Boolean(disabled));
      initialized.current = true;
    }).catch((error: unknown) => { if (active) console.error(error); });
    return () => { active = false; };
  }, [label, checked, defaultChecked, disabled]);

  return createElement('ui-toggle', {
    ...reactProps,
    ref: elementRef,
    role: 'switch',
    'aria-label': label,
  });
});
