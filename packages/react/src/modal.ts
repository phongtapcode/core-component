import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { HTMLAttributes } from 'react';
import type { UiModal } from '@element-works/components';
import { register } from './register.js';

export interface ModalProps extends HTMLAttributes<UiModal> {
  open?: boolean;
  defaultOpen?: boolean;
  dismissable?: boolean;
  onOpenChange?: (open: boolean, event: Event) => void;
}

export const Modal = forwardRef<UiModal, ModalProps>(function Modal(
  { open, defaultOpen, dismissable, onOpenChange, children, ...reactProps }, forwardedRef,
) {
  const elementRef = useRef<UiModal>(null);
  const initialized = useRef(false);
  useImperativeHandle(forwardedRef, () => elementRef.current!, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const onOpen = (event: Event) => onOpenChange?.(true, event);
    const onClose = (event: Event) => onOpenChange?.(false, event);
    element.addEventListener('ui-modal-open', onOpen);
    element.addEventListener('ui-modal-close', onClose);
    return () => {
      element.removeEventListener('ui-modal-open', onOpen);
      element.removeEventListener('ui-modal-close', onClose);
    };
  }, [onOpenChange]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    let active = true;
    void register('ui-modal').then(() => {
      if (!active) return;
      const nextOpen = open !== undefined ? open : !initialized.current ? defaultOpen : undefined;
      if (nextOpen === true) element.openModal();
      else if (nextOpen === false) element.closeModal();
      if (dismissable !== undefined) element.dismissable = dismissable;
      initialized.current = true;
    }).catch((error: unknown) => { if (active) console.error(error); });
    return () => { active = false; };
  }, [open, defaultOpen, dismissable]);

  return createElement('ui-modal', { ...reactProps, ref: elementRef }, children);
});
