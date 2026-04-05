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

export default function LobbyPage() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/tests/${id}`)
      .then((res) => setTest(res.data))
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load test details");
      });
  }, [id]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const startAt = test?.startTime ? new Date(test.startTime).getTime() : null;
  const endAt = test?.endTime ? new Date(test.endTime).getTime() : null;

  const notStarted = startAt ? now < startAt : false;
  const ended = endAt ? now > endAt : false;

  const statusText = useMemo(() => {
    if (error) return error;
    if (!test) return "Loading exam details...";
    if (notStarted) return `Exam starts in ${formatMs(startAt - now)}`;
    if (ended) return "Exam window has ended";
    return "Exam is open. You can proceed.";
  }, [error, test, notStarted, ended, startAt, now]);

  return (
    <main className="shell">
      <section className="card space-y-3">
        <h1 className="font-heading text-3xl font-bold">Pre-Exam Checklist</h1>
        <p className="rounded-xl border border-black/10 bg-white p-2 text-sm">
          {statusText}
        </p>
        <ul className="list-disc pl-5 text-black/80">
          <li>Stable internet connection</li>
          <li>Webcam enabled and facing your face</li>
          <li>No tab switching during exam</li>
          <li>Remain in fullscreen mode</li>
        </ul>
        {!notStarted && !ended && !error ? (
          <Link className="btn btn-primary" to={`/exam/${id}/session`}>
            Proceed to Exam
          </Link>
        ) : (
          <button className="btn btn-ghost" type="button" disabled>
            Proceed to Exam
          </button>
        )}
      </section>
    </main>
  );
}
