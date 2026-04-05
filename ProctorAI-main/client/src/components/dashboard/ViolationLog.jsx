export default function ViolationLog({ violations }) {
  return (
    <div className="card">
      <h3 className="font-heading text-lg font-semibold">Violation Timeline</h3>
      <ul className="mt-2 space-y-2 text-sm">
        {violations?.length ? (
          violations.map((v, idx) => (
            <li
              key={`${v.type}-${idx}`}
              className="rounded-lg border border-black/10 p-2"
            >
              <span className="font-semibold">{v.type}</span>
              <span className="ml-2 text-black/70">
                {new Date(v.timestamp).toLocaleString()}
              </span>
            </li>
          ))
        ) : (
          <li>No violations yet</li>
        )}
      </ul>
    </div>
  );
}
