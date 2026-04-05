import StudentCard from "./StudentCard.jsx";

export default function LiveMonitor({ sessions }) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {sessions.map((session) => (
        <StudentCard key={session._id} session={session} />
      ))}
    </section>
  );
}
