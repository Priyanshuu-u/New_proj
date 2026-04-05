import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api.js";

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
      <main className="shell">
        <section className="card space-y-2">
          <h1 className="font-heading text-3xl font-bold">Result</h1>
          <p className="text-signal">{error}</p>
        </section>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="shell">
        <section className="card">Loading result...</section>
      </main>
    );
  }

  const total = (result.test?.questions || []).reduce(
    (sum, q) => sum + (q.marks || 0),
    0,
  );

  return (
    <main className="shell">
      <section className="card space-y-2">
        <h1 className="font-heading text-3xl font-bold">Exam Result</h1>
        <p>
          Score: <strong>{result.score}</strong> / {total}
        </p>
        <p>Status: {result.status}</p>
        <p>Suspicion Score: {result.suspicionScore}</p>
      </section>
    </main>
  );
}
