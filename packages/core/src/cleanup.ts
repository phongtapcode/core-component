import type { CleanupTask, Disposer } from './types.js';

/**
 * CleanupRegistry — one per element instance.
 *
 * Every `addEventListener`, `IntersectionObserver.observe`, `setTimeout`,
 * `requestAnimationFrame`, focus listener on `document`, and third-party
 * subscription *must* be registered here so that `disconnectedCallback`
 * can release them. BaseElement calls `run()` on disconnect.
 *
 * Rules:
 *  - Tasks run in registration order.
 *  - Each task runs at most once per `run()` call.
 *  - A task that throws is logged but does not block the rest. We isolate
 *    failures because one bad cleanup leaving a timer ticking would defeat
 *    the whole purpose.
 *  - After `run()` the registry is empty and may be reused.
 *  - Tasks registered *during* a `run()` call are NOT executed in the
 *    current pass — they run on the next one. This prevents an infinite
 *    loop where a teardown adds a new teardown.
 */
export class CleanupRegistry {
  #tasks: CleanupTask[] = [];
  #running = false;

  /** Register a teardown task. Returns the same registry for chaining. */
  add(task: CleanupTask): this {
    if (typeof task !== 'function') {
      throw new TypeError('[ui/core#cleanup] task must be a function');
    }
    // Queue additions during a run; they execute on the next run() call.
    this.#tasks.push(task);
    return this;
  }

  /**
   * Convenience: register a function as a Disposer that auto-removes
   * itself when called. Useful for one-shot teardowns that need to fire
   * before the next disconnect.
   */
  defer(task: CleanupTask): Disposer {
    let fired = false;
    this.add(() => {
      if (fired) return;
      fired = true;
      task();
    });
    return () => {
      if (fired) return;
      fired = true;
      task();
    };
  }

  /** Run every registered task exactly once and reset. */
  run(): void {
    if (this.#running) return;
    this.#running = true;
    const tasks = this.#tasks;
    this.#tasks = [];
    for (const task of tasks) {
      try {
        task();
      } catch (error) {
        // Surface the failure without killing sibling tasks.
        // eslint-disable-next-line no-console
        console.error('[ui/core#cleanup] task failed:', error);
      }
    }
    this.#running = false;
  }

  /** Whether anything is registered. */
  get size(): number {
    return this.#tasks.length;
  }

  /** Drop every task without running them. Use only when the element is gone for good. */
  clear(): void {
    this.#tasks.length = 0;
  }
}