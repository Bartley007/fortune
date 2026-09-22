import type { ReactNode } from "react";
import type { ElementKey } from "@/lib/contracts/bazi";

/**
 * Stroke icons for the five elements: sprout, flame, hills, coin, droplet.
 * Inline SVG in currentColor, so they take the element colour of whatever
 * contains them and cost nothing to load.
 */
const GLYPHS: Record<ElementKey, ReactNode> = {
  wood: (
    <>
      <path d="M8 14.5V7" />
      <path d="M8 8.5C8 5.2 5.4 3 2.5 3c0 3.2 2.4 5.5 5.5 5.5Z" />
      <path d="M8 10c0-2.8 2.2-4.8 5-4.8 0 2.8-2.2 4.8-5 4.8Z" />
    </>
  ),
  fire: (
    <path d="M8 14.5c-2.9 0-4.7-2-4.7-4.5 0-3.2 2.7-4.8 3-8 2 1.3 2.6 3.2 2.3 4.7.9-.6 1.5-1.7 1.6-2.7 1.7 1.5 2.5 3.4 2.5 5.4 0 2.8-1.8 5.1-4.7 5.1Z" />
  ),
  earth: (
    <>
      <path d="M1.5 13.5h13" />
      <path d="M2.8 13.5 6.4 7l2.4 4 1.6-2.6 2.8 5.1" />
    </>
  ),
  metal: (
    <>
      <circle cx="8" cy="8" r="5.8" />
      <rect x="6.5" y="6.5" width="3" height="3" />
    </>
  ),
  water: <path d="M8 2c0 0-4.4 5-4.4 8.1a4.4 4.4 0 0 0 8.8 0C12.4 7 8 2 8 2Z" />,
};

export function ElementIcon({ element, size = 14 }: { element: ElementKey; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[element]}
    </svg>
  );
}
