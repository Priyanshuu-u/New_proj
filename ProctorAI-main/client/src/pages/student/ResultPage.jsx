import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api.js";

const VIOLATION_LABELS = {
  gaze_away: "Gaze Away",
  no_face: "Face Not Detected",
  multiple_faces: "Multiple Faces",
  phone_detected: "Phone Detected",
  book_detected: "Book / Notes Detected",
  tab_switch: "Tab Switch",
  fullscreen_exit: "Fullscreen Exited",
  window_blur: "Window Lost Focus",
  copy: "Copy Attempt",
  cut: "Cut Attempt",
  paste: "Paste Attempt",
  context_menu: "Right-Click",
};

const SEVERITY_COLORS = {
  high: "badge-red",
  medium: "badge-amber",
  low: "badge-blue",
};

export default function ResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/sessions/my/${id}`)
      .then((res) => setResult(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Result not available yet"),
      );
  }, [id]);

  if (error) {
    return (
      <main className="shell py-8">
        <div className="card max-w-md mx-auto text-center space-y-4">
          <span className="text-4xl">⚠</span>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Result Unavailable</h1>
          <p className="text-red-600 text-sm">{error}</p>
          <Link className="btn btn-ghost" to="/home">Back to Exams</Link>
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="shell py-8 flex justify-center">
        <div className="card text-center space-y-3 max-w-xs w-full">
          <svg className="w-8 h-8 animate-spin text-slate-400 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-600 font-medium">Loading result...</p>
        </div>
      </main>
    );
  }

  const total = (result.test?.questions || []).reduce(
    (sum, q) => sum + (q.marks || 0),
    0,
  );
  const scorePercent = total > 0 ? Math.round((result.score / total) * 100) : 0;
  const suspicionLevel =
    result.suspicionScore > 60 ? "High" : result.suspicionScore > 30 ? "Medium" : "Low";
  const suspicionColor =
    result.suspicionScore > 60
      ? "text-red-600"
      : result.suspicionScore > 30
      ? "text-amber-600"
      : "text-emerald-600";

  const statusLabel =
    result.status === "auto-submitted"
      ? "Auto Submitted"
      : result.status === "terminated"
      ? "Terminated"
      : "Submitted";

  const violations = result.violations || [];
  const violationCounts = violations.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <main className="shell py-8 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Exam Result</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {result.test?.title || "Unknown Exam"}
          </p>
        </div>
        <span
          className={`badge flex-shrink-0 ${
            result.status === "auto-submitted" || result.status === "terminated"
              ? "badge-red"
              : "badge-green"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Score card */}
      <div className="card bg-slate-900 text-white space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wide font-medium">Score</p>
            <p className="font-heading text-3xl font-bold text-white mt-1">
              {result.score}
              <span className="text-white/40 text-lg font-normal"> / {total}</span>
            </p>
            <p className="text-emerald-400 text-sm font-semibold mt-0.5">{scorePercent}%</p>
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wide font-medium">Risk</p>
            <p className={`font-heading text-3xl font-bold mt-1 ${
              result.suspicionScore > 60 ? "text-red-400" : result.suspicionScore > 30 ? "text-amber-400" : "text-emerald-400"
            }`}>
              {result.suspicionScore}
            </p>
            <p className={`text-sm font-semibold mt-0.5 ${suspicionColor.replace("text-", "text-")}`}>
              {suspicionLevel}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wide font-medium">Violations</p>
            <p className="font-heading text-3xl font-bold text-white mt-1">{violations.length}</p>
            <p className="text-white/40 text-sm mt-0.5">incidents</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="score-bar" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="score-bar-fill"
            style={{
              width: `${scorePercent}%`,
              background: scorePercent >= 70 ? "#10b981" : scorePercent >= 40 ? "#f59e0b" : "#ef4444",
            }}
          />
        </div>
      </div>

      {/* Violation breakdown */}
      {Object.keys(violationCounts).length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-heading font-semibold text-slate-900">Violation Summary</h2>
          <div className="space-y-2">
            {Object.entries(violationCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-700">
                  {VIOLATION_LABELS[type] || type.replaceAll("_", " ")}
                </span>
                <span className="badge badge-slate">{count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link className="btn btn-ghost w-full" to="/home">
        ← Back to My Exams
      </Link>
    </main>
  );
}
