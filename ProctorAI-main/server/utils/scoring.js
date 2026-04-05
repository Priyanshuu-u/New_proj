const POINTS = {
  no_face: 8,
  multiple_faces: 15,
  gaze_away: 5,
  phone_detected: 20,
  tab_switch: 10,
  fullscreen_exit: 8,
  book_detected: 12,
};

export function addSuspicionPoints(current, violationType) {
  const next = current + (POINTS[violationType] || 0);
  return Math.min(100, Math.max(0, next));
}

export function decaySuspicionScore(current) {
  return Math.max(0, current - 1);
}
