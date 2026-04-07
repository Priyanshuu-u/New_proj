import { useEffect, useRef, useState } from "react";

const VIOLATION_CONFIG = {
  gaze_away: {
    label: "Gaze Away",
    detail: "Keep your eyes on the screen",
    color: "amber",
    icon: "👁",
  },
  no_face: {
    label: "Face Not Detected",
    detail: "Your face must remain visible",
    color: "red",
    icon: "🙈",
  },
  multiple_faces: {
    label: "Multiple Faces",
    detail: "Only one person allowed in frame",
    color: "red",
    icon: "👥",
  },
  phone_detected: {
    label: "Phone Detected",
    detail: "Electronic devices are not allowed",
    color: "red",
    icon: "📱",
  },
  book_detected: {
    label: "Book / Notes Detected",
    detail: "Reference materials are not allowed",
    color: "amber",
    icon: "📚",
  },
  tab_switch: {
    label: "Tab Switch",
    detail: "Do not leave this window",
    color: "red",
    icon: "🔀",
  },
  fullscreen_exit: {
    label: "Fullscreen Exited",
    detail: "Return to fullscreen to continue",
    color: "amber",
    icon: "↙",
  },
  window_blur: {
    label: "Window Lost Focus",
    detail: "Stay focused on the exam window",
    color: "amber",
    icon: "⚠",
  },
  copy: { label: "Copy Attempt", detail: "Copying is not permitted", color: "blue", icon: "⎘" },
  cut: { label: "Cut Attempt", detail: "Cutting is not permitted", color: "blue", icon: "✂" },
  paste: { label: "Paste Attempt", detail: "Pasting is not permitted", color: "blue", icon: "📋" },
  context_menu: {
    label: "Right-Click Blocked",
    detail: "Context menu is disabled",
    color: "blue",
    icon: "🖱",
  },
};

const COLOR_CLASSES = {
  red: {
    bg: "bg-red-600",
    border: "border-red-500",
    text: "text-white",
    sub: "text-red-100",
    badge: "bg-red-800",
  },
  amber: {
    bg: "bg-amber-500",
    border: "border-amber-400",
    text: "text-white",
    sub: "text-amber-100",
    badge: "bg-amber-700",
  },
  blue: {
    bg: "bg-blue-600",
    border: "border-blue-500",
    text: "text-white",
    sub: "text-blue-100",
    badge: "bg-blue-800",
  },
};

export default function ViolationOverlay({ lastViolation, violationsCount, maxViolations }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [displayed, setDisplayed] = useState(null);
  const exitTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    if (!lastViolation) return;

    // Cancel any existing exit animation
    clearTimeout(exitTimerRef.current);
    clearTimeout(hideTimerRef.current);

    setDisplayed(lastViolation);
    setExiting(false);
    setVisible(true);

    // Begin exit animation after 4s
    hideTimerRef.current = setTimeout(() => {
      setExiting(true);
      exitTimerRef.current = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 350);
    }, 4000);

    return () => {
      clearTimeout(exitTimerRef.current);
      clearTimeout(hideTimerRef.current);
    };
  }, [lastViolation]);

  if (!visible || !displayed) return null;

  const cfg = VIOLATION_CONFIG[displayed.type] || {
    label: displayed.type.replaceAll("_", " "),
    detail: "Suspicious activity detected",
    color: "red",
    icon: "⚠",
  };
  const colors = COLOR_CLASSES[cfg.color] || COLOR_CLASSES.red;

  return (
    <div
      className={`fixed inset-x-0 top-0 z-50 flex justify-center pt-4 px-4 pointer-events-none ${
        exiting ? "violation-exit" : "violation-enter"
      }`}
    >
      <div
        className={`pointer-events-auto flex items-center gap-4 rounded-2xl border ${colors.border} ${colors.bg} px-5 py-3.5 shadow-2xl max-w-lg w-full`}
      >
        <span className="text-2xl flex-shrink-0">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${colors.text}`}>
            Warning: {cfg.label}
          </p>
          <p className={`text-xs mt-0.5 ${colors.sub}`}>{cfg.detail}</p>
        </div>
        {violationsCount !== undefined && (
          <span className={`${colors.badge} ${colors.text} text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0`}>
            {violationsCount}/{maxViolations}
          </span>
        )}
      </div>
    </div>
  );
}
