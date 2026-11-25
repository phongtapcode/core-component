import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { HTMLAttributes } from 'react';
import { register, type UiTag } from './register.js';

export type ElementAttributes = Record<string, string | number | boolean | null | undefined>;
export type ElementEvents = Record<string, (event: CustomEvent<unknown>) => void>;

export interface ElementProps extends HTMLAttributes<HTMLElement> {
  tag: UiTag;
  attributes?: ElementAttributes;
  properties?: Record<string, unknown>;
  events?: ElementEvents;
}

/** Escape hatch for every published ui-* tag, including newly added components. */
export const Element = forwardRef<HTMLElement, ElementProps>(function Element(
  { tag, attributes, properties, events, children, ...reactProps }, forwardedRef,
) {
  const elementRef = useRef<HTMLElement>(null);
  const previousAttributes = useRef<string[]>([]);
  useImperativeHandle(forwardedRef, () => elementRef.current!, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    let active = true;
    void register(tag).then(() => {
      if (!active) return;
      const nextAttributes = attributes ?? {};
      for (const name of previousAttributes.current) {
        if (!(name in nextAttributes)) element.removeAttribute(name);
      }
      for (const [name, value] of Object.entries(nextAttributes)) {
        if (value === false || value === null || value === undefined) element.removeAttribute(name);
        else element.setAttribute(name, value === true ? '' : String(value));
      }
      previousAttributes.current = Object.keys(nextAttributes);
      for (const [name, value] of Object.entries(properties ?? {})) {
        (element as unknown as Record<string, unknown>)[name] = value;
      }
    }).catch((error: unknown) => {
      if (active) console.error(error);
    });
    return () => { active = false; };
  }, [tag, attributes, properties]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !events) return;
    const listeners = Object.entries(events).map(([name, callback]) => {
      const listener = (event: Event) => callback(event as CustomEvent<unknown>);
      element.addEventListener(name, listener);
      return [name, listener] as const;
    });
    return () => {
      for (const [name, listener] of listeners) element.removeEventListener(name, listener);
    };
  }, [events]);

  return createElement(tag, { ...reactProps, ref: elementRef }, children);
});
