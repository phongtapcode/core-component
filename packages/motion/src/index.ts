/**
 * @ui/motion — public entry point.
 *
 * Side-effect imports (register custom elements).
 */

import './animate.js';
import './parallax.js';
import './scroll-x.js';
import './scroll-y.js';
import './scroll-scene.js';
import './typing.js';

export { UiAnimate, animate } from './animate.js';
export { UiParallax, UiParallaxScroll, UiParallaxHover, parallax, parallaxScroll, parallaxHover, type ParallaxCustomEffectsParams } from './parallax.js';
export { UiScrollX, UiScrollXInner, UiScrollXItem, UiScrollXYItem, scrollX, scrollXInner, scrollXItem, scrollXYItem } from './scroll-x.js';
export { UiScrollY, UiScrollYInner, UiScrollYItem, scrollY, scrollYInner, scrollYItem } from './scroll-y.js';
export { UiScrollScene, UiScrollSceneInner, UiScrollSceneItem, UiScrollSceneItemFocus, scrollScene, scrollSceneInner, scrollSceneItem, scrollSceneItemFocus } from './scroll-scene.js';
export { UiTyping, UiTypingInner, UiTypingContent, typing, typingInner, typingContent } from './typing.js';
export { parseKeyframes, parseParallaxBreakpoints, resolveKeyframes, sampleKeyframes, resolveScrollPosition, type ParallaxKeyframes, type ParallaxBreakpoints, type ParallaxFrame, type ParallaxValue } from './parallax-utils.js';

export {
  EFFECT_CATALOG,
  EFFECTS,
  DEFAULT_DURATIONS,
  isValidEffect,
  type EffectMeta,
  type EffectName,
} from './effects.js';
