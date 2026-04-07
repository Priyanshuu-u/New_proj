import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";

export default function HomePage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/tests")
      .then((res) => setTests(res.data))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="shell py-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Available Exams</h1>
        <p className="text-slate-500 mt-1 text-sm">Select an exam to enter the lobby and begin.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
              <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
              <div className="h-8 bg-slate-100 rounded-lg w-32" />
            </div>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="card text-center py-16 space-y-3">
          <p className="text-4xl">📝</p>
          <h2 className="font-heading font-semibold text-slate-900">No exams available</h2>
          <p className="text-slate-500 text-sm">Check back later or contact your examiner.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((test) => (
            <article
              key={test._id}
              className="card hover:shadow-md transition-shadow duration-200 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-heading text-xl font-semibold text-slate-900 leading-tight">
                  {test.title}
                </h2>
                <span className="badge badge-blue flex-shrink-0">Open</span>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 7v5l3 3" />
                  </svg>
                  {test.duration} min
                </span>
                {test.questions?.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {test.questions.length} questions
                  </span>
                )}
              </div>

              <Link
                className="btn btn-primary w-full text-sm"
                to={`/exam/${test._id}/lobby`}
              >
                Enter Lobby →
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
