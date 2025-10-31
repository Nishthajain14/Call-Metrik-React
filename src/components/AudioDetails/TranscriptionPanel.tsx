export default function TranscriptionPanel({ text }) {
  return (
    <pre className="whitespace-pre-wrap text-sm leading-6">{text || '-'}</pre>
  );
}
