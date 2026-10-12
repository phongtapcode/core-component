/**
 * Effect catalog — every supported effect name and its semantic direction.
 * The CSS in css/motion.css implements the corresponding [data-effect='…'] rules.
 */

export const EFFECTS = [
  'fade',
  'fade-up',
  'fade-down',
  'fade-left',
  'fade-right',
  'slide-up',
  'slide-down',
  'slide-left',
  'slide-right',
  'zoom-in',
  'zoom-out',
  'scale-up',
  'scale-down',
  'blur',
  'rotate',
] as const;

export type EffectName = (typeof EFFECTS)[number];

export function isValidEffect(name: string): name is EffectName {
  return (EFFECTS as readonly string[]).includes(name);
}

/** Fallback duration in ms for each effect when `duration` is invalid or zero. */
export const DEFAULT_DURATIONS: Readonly<Record<EffectName, number>> = {
  fade: 500,
  'fade-up': 500,
  'fade-down': 500,
  'fade-left': 500,
  'fade-right': 500,
  'slide-up': 500,
  'slide-down': 500,
  'slide-left': 500,
  'slide-right': 500,
  'zoom-in': 500,
  'zoom-out': 500,
  'scale-up': 500,
  'scale-down': 500,
  blur: 500,
  rotate: 500,
};

/** Effect catalog metadata (for /docs and /html surfacing). */
export interface EffectMeta {
  readonly name: EffectName;
  readonly label: string;
  readonly description: string;
}

export const EFFECT_CATALOG: readonly EffectMeta[] = [
  { name: 'fade', label: 'Fade', description: 'Fade in without translation.' },
  { name: 'fade-up', label: 'Fade Up', description: 'Fade in while rising from below.' },
  { name: 'fade-down', label: 'Fade Down', description: 'Fade in while falling from above.' },
  { name: 'fade-left', label: 'Fade Left', description: 'Fade in while sliding from the right.' },
  { name: 'fade-right', label: 'Fade Right', description: 'Fade in while sliding from the left.' },
  { name: 'slide-up', label: 'Slide Up', description: 'Slide in from the bottom edge.' },
  { name: 'slide-down', label: 'Slide Down', description: 'Slide in from the top edge.' },
  { name: 'slide-left', label: 'Slide Left', description: 'Slide in from the right edge.' },
  { name: 'slide-right', label: 'Slide Right', description: 'Slide in from the left edge.' },
  { name: 'zoom-in', label: 'Zoom In', description: 'Scale from 68% to 100%.' },
  { name: 'zoom-out', label: 'Zoom Out', description: 'Scale from 132% to 100%.' },
  { name: 'scale-up', label: 'Scale Up', description: 'Scale from 80% to 100%.' },
  { name: 'scale-down', label: 'Scale Down', description: 'Scale from 120% to 100%.' },
  { name: 'blur', label: 'Blur', description: 'Reveal from a 12px blur to sharp.' },
  { name: 'rotate', label: 'Rotate', description: 'Rotate from -12° to 0° while fading.' },
];
