/**
 * Typical busyness by hour, 0..1, from a pilot café footfall curve.
 * Kept in its own dependency-free module so client components can chart it
 * without pulling the Gemini SDK into the browser bundle.
 */
export const HOURLY_LOAD: number[] = [
  0, 0, 0, 0, 0, 0, 0.1, 0.3, 0.7, 0.9, 0.8, 0.6, 0.8, 0.9, 0.6, 0.4, 0.5, 0.7, 0.8, 0.6, 0.4, 0.2, 0, 0,
];
