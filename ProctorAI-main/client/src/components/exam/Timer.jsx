export default function Timer({ label }) {
  return (
    <div className="rounded-xl bg-ink px-4 py-2 text-lg font-bold text-sand">
      Time Left: {label}
    </div>
  );
}
