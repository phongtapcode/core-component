/**
 * Carousel synchronization & named registry manager.
 * Prevents infinite event loops with origin/synchronization flags.
 */

import type { CarouselInstance } from './types.js';

interface Registrant {
  readonly id: string;
  readonly name?: string | undefined;
  readonly syncId?: string | undefined;
  readonly instance: CarouselInstance;
}

const registry = new Map<string, Registrant>();
let isBroadcasting = false;

export function registerCarousel(
  id: string,
  instance: CarouselInstance,
  name?: string | undefined,
  syncId?: string | undefined,
): () => void {
  registry.set(id, { id, name, syncId, instance });
  return () => {
    registry.delete(id);
  };
}

export function updateRegistration(
  id: string,
  instance: CarouselInstance,
  name?: string | undefined,
  syncId?: string | undefined,
): void {
  if (registry.has(id)) {
    registry.set(id, { id, name, syncId, instance });
  }
}

export function getCarouselByName(name: string): CarouselInstance | undefined {
  for (const reg of registry.values()) {
    if (reg.name === name) return reg.instance;
  }
  return undefined;
}

/**
 * Synchronize all carousels sharing `syncId` to `targetIndex`.
 * Guarded against recursive infinite loops.
 */
export function syncWithPeers(sourceId: string, syncId: string | undefined, targetIndex: number): void {
  if (!syncId || isBroadcasting) return;

  isBroadcasting = true;
  try {
    for (const [id, reg] of registry.entries()) {
      if (id !== sourceId && reg.syncId === syncId) {
        if (reg.instance.activeIndex !== targetIndex) {
          reg.instance.goTo(targetIndex);
        }
      }
    }
  } finally {
    isBroadcasting = false;
  }
}
