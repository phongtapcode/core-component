/** Load only the browser package that owns a tag. No Web Component code runs during SSR. */
export type UiTag = `ui-${string}`;

const motionTags = new Set<string>([
  'ui-animate', 'ui-parallax', 'ui-parallax-scroll', 'ui-parallax-hover',
  'ui-scroll-x', 'ui-scroll-x-inner', 'ui-scroll-x-item', 'ui-scroll-xy-item',
  'ui-scroll-y', 'ui-scroll-y-inner', 'ui-scroll-y-item',
  'ui-scroll-scene', 'ui-scroll-scene-inner', 'ui-scroll-scene-item',
  'ui-scroll-scene-item-focus', 'ui-typing', 'ui-typing-inner', 'ui-typing-content',
]);

let componentsPromise: Promise<unknown> | undefined;
let motionPromise: Promise<unknown> | undefined;

function loadComponents(): Promise<unknown> {
  return componentsPromise ??= import('@element-works/components').catch((error: unknown) => {
    componentsPromise = undefined;
    throw error;
  });
}

function loadMotion(): Promise<unknown> {
  return motionPromise ??= import('@element-works/motion').catch((error: unknown) => {
    motionPromise = undefined;
    throw error;
  });
}

export async function register(tag?: UiTag): Promise<void> {
  if (typeof customElements === 'undefined') return;
  if (tag && customElements.get(tag)) return;

  if (tag) {
    await (motionTags.has(tag) ? loadMotion() : loadComponents());
    if (!customElements.get(tag)) throw new Error(`Element Works does not define <${tag}>`);
    return;
  }

  await Promise.all([loadComponents(), loadMotion()]);
}
