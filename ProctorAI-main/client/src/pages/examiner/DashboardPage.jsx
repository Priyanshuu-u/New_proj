import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";

export default function DashboardPage() {
  const [tests, setTests] = useState([]);

  useEffect(() => {
    api
      .get("/tests")
      .then((res) => setTests(res.data))
      .catch(() => setTests([]));
  }, []);

  return (
    <main className="shell space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Examiner Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/tests" className="btn btn-ghost">
            Manage Tests
          </Link>
          <Link to="/tests/create" className="btn btn-primary">
            Create Test
          </Link>
        </div>
      </div>
      <section className="grid gap-3 md:grid-cols-3">
        <article className="card">
          <p className="text-sm text-black/60">Total Tests</p>
          <p className="font-heading text-3xl font-bold">{tests.length}</p>
        </article>
        <article className="card">
          <p className="text-sm text-black/60">Upcoming</p>
          <p className="font-heading text-3xl font-bold">
            {
              tests.filter(
                (t) => t.startTime && new Date(t.startTime) > new Date(),
              ).length
            }
          </p>
        </article>
        <article className="card">
          <p className="text-sm text-black/60">Active Windows</p>
          <p className="font-heading text-3xl font-bold">
            {
              tests.filter((t) => {
                const now = new Date();
                const startOk = !t.startTime || new Date(t.startTime) <= now;
                const endOk = !t.endTime || new Date(t.endTime) >= now;
                return startOk && endOk;
              }).length
            }
          </p>
        </article>
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        {tests.map((test) => (
          <article className="card" key={test._id}>
            <h2 className="font-heading text-xl font-semibold">{test.title}</h2>
            <p className="text-sm text-black/70">
              Duration: {test.duration} min
            </p>
            <div className="mt-3 flex gap-2">
              <Link className="btn btn-ghost" to={`/tests/${test._id}/monitor`}>
                Monitor
              </Link>
              <Link className="btn btn-ghost" to={`/tests/${test._id}/results`}>
                Results
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
