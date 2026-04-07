export default function Timer({ label, secondsLeft }) {
  const urgent = secondsLeft !== undefined && secondsLeft <= 120;
  const warning = secondsLeft !== undefined && secondsLeft <= 300 && secondsLeft > 120;

  let classes =
    "flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-bold text-lg tabular-nums shadow-sm select-none";

  if (urgent) {
    classes += " bg-red-600 text-white animate-pulse";
  } else if (warning) {
    classes += " bg-amber-500 text-white";
  } else {
    classes += " bg-slate-900 text-white";
  }

  return (
    <div className={classes}>
      <svg
        className="w-5 h-5 flex-shrink-0 opacity-80"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v5l3 3" />
      </svg>
      {label}
    </div>
  );
}
