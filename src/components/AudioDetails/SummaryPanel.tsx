export default function SummaryPanel({ summary }) {
  return (
    <pre className="whitespace-pre-wrap text-sm leading-6">{summary || '-'}</pre>
  );
}
