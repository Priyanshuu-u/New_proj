export default function QuestionPanel({ questions, answers, setAnswers }) {
  const answeredCount = questions.filter((q) => {
    const ans = answers[q._id];
    return ans !== undefined && ans !== "";
  }).length;

  const total = questions.length;
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="card py-3.5 px-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Progress</p>
          <p className="font-heading font-semibold text-slate-900 mt-0.5">
            {answeredCount} / {total} answered
          </p>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="score-bar">
            <div
              className="score-bar-fill"
              style={{
                width: `${progress}%`,
                background: progress === 100 ? "#10b981" : "#3b82f6",
              }}
            />
          </div>
          <p className="text-right text-xs text-slate-400 mt-1">{progress}%</p>
        </div>
        {progress === 100 && (
          <span className="badge badge-green">All done</span>
        )}
      </div>

      {/* Questions */}
      {questions.map((q, i) => {
        const isAnswered =
          answers[q._id] !== undefined && answers[q._id] !== "";

        return (
          <div
            className={`card space-y-3 transition-all duration-200 ${
              isAnswered ? "border-slate-300" : "border-slate-200"
            }`}
            key={q._id || i}
          >
            {/* Question header */}
            <div className="flex items-start gap-3">
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isAnswered
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {isAnswered ? "✓" : i + 1}
              </span>
              <p className="font-medium text-slate-900 leading-snug pt-0.5">
                {q.text}
              </p>
            </div>

            {/* MCQ options */}
            {q.type === "mcq" ? (
              <div className="ml-10 space-y-2">
                {q.options?.map((option, oi) => {
                  const selected = answers[q._id] === option;
                  return (
                    <label
                      key={option}
                      className={`option-label ${selected ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`q-${i}`}
                        value={option}
                        checked={selected}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q._id]: e.target.value,
                          }))
                        }
                      />
                      <span
                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          selected
                            ? "border-white bg-white"
                            : "border-slate-300"
                        }`}
                      >
                        {selected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-900 block" />
                        )}
                      </span>
                      <span className="text-sm leading-snug">
                        <span className="text-slate-400 font-medium mr-1.5">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        {option}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea
                className="ml-10 w-[calc(100%-2.5rem)] rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-slate-500 focus:outline-none resize-none transition-colors"
                rows={4}
                placeholder="Type your answer here..."
                value={answers[q._id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [q._id]: e.target.value,
                  }))
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
