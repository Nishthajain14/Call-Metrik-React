export default function AgentFeedbackPanel({ feedback, improvement, highlights }) {
  const imp = feedback?.improvement || improvement || [];
  const high = feedback?.highlights || highlights || [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card p-3">
        <div className="text-base md:text-lg font-semibold font-display mb-2">Areas of Improvement</div>
        <ul className="list-disc pl-5 text-sm leading-6 space-y-1 font-body">
          {imp.map((x, i) => (<li key={i}>{x}</li>))}
          {!imp.length && <li className="text-neutral-500 dark:text-neutral-400">None provided</li>}
        </ul>
      </div>
      <div className="card p-3">
        <div className="text-base md:text-lg font-semibold font-display mb-2">Agent Highlights</div>
        <ul className="list-disc pl-5 text-sm leading-6 space-y-1 font-body">
          {high.map((x, i) => (<li key={i}>{x}</li>))}
          {!high.length && <li className="text-neutral-500 dark:text-neutral-400">None provided</li>}
        </ul>
      </div>
    </div>
  );
}
