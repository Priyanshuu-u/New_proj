import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext.jsx";
import api from "../../services/api.js";

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [error, setError] = useState("");
  const { pushToast } = useToast();

  async function loadTests() {
    try {
      const { data } = await api.get("/tests");
      setTests(data);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load tests";
      setError(msg);
      pushToast("Load failed", msg, "error");
    }
  }

  useEffect(() => {
    loadTests();
  }, []);

  async function removeTest(id) {
    const ok = window.confirm("Delete this test permanently?");
    if (!ok) return;
    try {
      await api.delete(`/tests/${id}`);
      pushToast("Test deleted", "Item removed successfully", "success");
      await loadTests();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete test";
      pushToast("Delete failed", msg, "error");
    }
  }

  return (
    <main className="shell space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">All Tests</h1>
        <Link className="btn btn-primary" to="/tests/create">
          Create Test
        </Link>
      </div>

      {error ? <p className="text-signal">{error}</p> : null}

      <section className="grid gap-3 md:grid-cols-2">
        {tests.map((test) => (
          <article className="card" key={test._id}>
            <h2 className="font-heading text-xl font-semibold">{test.title}</h2>
            <p className="text-sm text-black/70">
              {test.description || "No description"}
            </p>
            <p className="mt-1 text-sm text-black/70">
              Duration: {test.duration} min
            </p>
            <p className="text-sm text-black/70">
              Questions: {(test.questions || []).length}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="btn btn-ghost" to={`/tests/${test._id}/edit`}>
                Edit
              </Link>
              <Link className="btn btn-ghost" to={`/tests/${test._id}/monitor`}>
                Monitor
              </Link>
              <Link className="btn btn-ghost" to={`/tests/${test._id}/results`}>
                Results
              </Link>
              <button
                className="btn btn-ghost"
                onClick={() => removeTest(test._id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
