export default function AgentFeedbackPanel({ feedback, improvement, highlights }) {
  const imp = feedback?.improvement || improvement || [];
  const high = feedback?.highlights || highlights || [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border border-neutral-800 rounded-lg p-3">
        <div className="text-sm font-medium mb-2">Area of Improvement</div>
        <ul className="list-disc pl-5 text-sm space-y-2">{imp.map((x, i) => (<li key={i}>{x}</li>))}</ul>
      </div>
      <div className="border border-neutral-800 rounded-lg p-3">
        <div className="text-sm font-medium mb-2">Agent Highlights</div>
        <ul className="list-disc pl-5 text-sm space-y-2">{high.map((x, i) => (<li key={i}>{x}</li>))}</ul>
      </div>
    </div>
  );
}
