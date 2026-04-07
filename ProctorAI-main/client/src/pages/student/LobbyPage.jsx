import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api.js";

function formatMs(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const CHECKLIST = [
  "Stable internet connection",
  "Webcam enabled and facing your face",
  "Good lighting — face clearly visible",
  "No phones or reference materials nearby",
  "Do not switch tabs during the exam",
  "Stay in fullscreen for the entire session",
];

export default function LobbyPage() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/tests/${id}`)
      .then((res) => setTest(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load test details"),
      );
  }, [id]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const startAt = test?.startTime ? new Date(test.startTime).getTime() : null;
  const endAt = test?.endTime ? new Date(test.endTime).getTime() : null;
  const notStarted = startAt ? now < startAt : false;
  const ended = endAt ? now > endAt : false;
  const canEnter = !notStarted && !ended && !error && Boolean(test);

  const statusText = useMemo(() => {
    if (error) return error;
    if (!test) return "Loading exam details...";
    if (notStarted) return `Exam opens in ${formatMs(startAt - now)}`;
    if (ended) return "Exam window has closed";
    return "Exam is open — you may proceed";
  }, [error, test, notStarted, ended, startAt, now]);

  return (
    <main className="shell py-8 max-w-lg space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">
          Pre-Exam Lobby
        </p>
        <h1 className="font-heading text-3xl font-bold text-slate-900">
          {test ? test.title : "Loading..."}
        </h1>
        {test && (
          <p className="text-slate-500 mt-1 text-sm">
            {test.duration} minutes &nbsp;·&nbsp; {test.questions?.length ?? 0} questions
          </p>
        )}
      </div>

      {/* Status */}
      <div
        className={`card flex items-center gap-3 ${
          error
            ? "border-red-200 bg-red-50"
            : canEnter
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <span className="text-2xl flex-shrink-0">
          {error ? "⚠" : canEnter ? "✅" : "⏳"}
        </span>
        <p
          className={`font-medium text-sm ${
            error ? "text-red-700" : canEnter ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {statusText}
        </p>
      </div>

      {/* Checklist */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
          Before You Begin
        </h2>
        {CHECKLIST.map((item) => (
          <div key={item} className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-slate-300 flex-shrink-0 mt-0.5" />
            <span className="text-slate-700">{item}</span>
          </div>
        ))}
      </div>

      {/* Action */}
      {canEnter ? (
        <Link
          className="btn btn-primary w-full py-3 text-base"
          to={`/exam/${id}/session`}
        >
          Proceed to Secure Setup →
        </Link>
      ) : (
        <button className="btn btn-ghost w-full py-3 text-base" disabled>
          Exam Not Available
        </button>
      )}
    </main>
  );
}
