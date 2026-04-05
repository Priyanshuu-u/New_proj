import { useEffect, useMemo, useRef, useState } from "react";

export function useExamTimer(totalMinutes, onFinished, active = true) {
  const [seconds, setSeconds] = useState(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!active || !Number.isFinite(totalMinutes) || totalMinutes <= 0) {
      setSeconds(null);
      finishedRef.current = false;
      return;
    }

    setSeconds(Math.max(0, Math.floor(totalMinutes * 60)));
    finishedRef.current = false;
  }, [totalMinutes, active]);

  useEffect(() => {
    if (!active || seconds === null) return;

    if (seconds <= 0 && !finishedRef.current) {
      finishedRef.current = true;
      onFinished?.("time_up");
      return;
    }

    if (seconds <= 0) return;

    const id = window.setInterval(() => {
      setSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [seconds, onFinished, active]);

  const label = useMemo(() => {
    if (seconds === null) return "--:--";
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [seconds]);

  return { seconds: seconds ?? 0, label };
}
