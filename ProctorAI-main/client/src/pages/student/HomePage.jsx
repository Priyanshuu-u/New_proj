import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";

export default function HomePage() {
  const [tests, setTests] = useState([]);

  useEffect(() => {
    api
      .get("/tests")
      .then((res) => setTests(res.data))
      .catch(() => setTests([]));
  }, []);

  return (
    <main className="shell space-y-4">
      <h1 className="font-heading text-3xl font-bold">Available Exams</h1>
      <section className="grid gap-3 md:grid-cols-2">
        {tests.map((test) => (
          <article className="card" key={test._id}>
            <h2 className="font-heading text-xl font-semibold">{test.title}</h2>
            <p className="text-sm text-black/70">
              Duration: {test.duration} minutes
            </p>
            <div className="mt-3 flex gap-2">
              <Link className="btn btn-ghost" to={`/exam/${test._id}/lobby`}>
                Enter Lobby
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
