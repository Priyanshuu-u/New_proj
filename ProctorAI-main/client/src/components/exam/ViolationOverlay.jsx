export default function ViolationOverlay({ lastViolation }) {
  if (!lastViolation) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-xl border border-signal/40 bg-white px-4 py-3 text-sm shadow-lg">
      <strong>Warning:</strong> {lastViolation.type.replaceAll("_", " ")}{" "}
      detected
    </div>
  );
}
