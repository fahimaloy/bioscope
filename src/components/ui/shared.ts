/**
 * Shared class fragments for the UI primitives.
 *
 * The focus ring is the one piece of interaction chrome every primitive needs
 * (docs/DESIGN_CONTRACT.md §6), so it lives here rather than being retyped —
 * drifting — in nineteen files.
 */

import type { MutableRefObject, Ref } from 'react';

/**
 * Visible focus ring on a light/paper surface: the token-system `--ring`
 * (gold) with a paper offset so it separates from the surface beneath.
 */
export const FOCUS_VISIBLE =
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-raised)]';

/**
 * Ink ring for filled brand surfaces (gold/pink/red fills), where a gold ring
 * would disappear against the fill it outlines.
 */
export const FOCUS_VISIBLE_INK =
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-raised)]';

/**
 * Callback ref that publishes a node to several refs at once — an internal ref
 * a component needs for its own behaviour, plus the `ref` a consumer passed.
 */
export function setRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as MutableRefObject<T | null>).current = node;
    }
  };
}
