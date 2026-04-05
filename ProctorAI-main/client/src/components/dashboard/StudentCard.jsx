export default function StudentCard({ session }) {
  const suspicion = session.suspicionScore || 0;
  const risk = suspicion > 60 ? "High" : suspicion > 30 ? "Medium" : "Low";
  const violations = [...(session.violations || [])]
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, 5);

  return (
    <div className="card">
      <h3 className="font-heading text-lg font-semibold">
        {session.student?.name || "Student"}
      </h3>
      <p className="text-sm text-black/70">Score: {session.score || 0}</p>
      <p className="text-sm text-black/70">Suspicion: {suspicion}</p>
      <p className="text-sm font-semibold">Risk: {risk}</p>
      <p className="mt-2 text-xs text-black/60">
        Violations Logged: {session.violations?.length || 0}
      </p>
      <div className="mt-2 space-y-2">
        {violations.length ? (
          violations.map((violation, idx) => (
            <article
              key={`${violation.type}-${violation.timestamp || idx}-${idx}`}
              className="rounded-lg border border-black/10 p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold">
                  {violation.type?.replaceAll("_", " ") || "Violation"}
                </p>
                <span className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] uppercase text-black/70">
                  {violation.severity || "low"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-black/60">
                {violation.timestamp
                  ? new Date(violation.timestamp).toLocaleTimeString()
                  : "time unknown"}
              </p>
              {violation.snapshot ? (
                <img
                  src={violation.snapshot}
                  alt="Violation frame"
                  className="mt-2 h-24 w-full rounded-md border border-black/10 object-cover"
                />
              ) : null}
            </article>
          ))
        ) : (
          <p className="text-xs text-black/60">No violations yet.</p>
        )}
      </div>
    </div>
  );
}
