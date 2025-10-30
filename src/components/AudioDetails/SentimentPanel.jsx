import SentimentChart from './SentimentChart';

export default function SentimentPanel({ sentiment }) {
  return (
    <div className="space-y-4">
      <div className="text-sm">Neutral: {sentiment?.neutral ?? 0}% &nbsp; Negative: {sentiment?.negative ?? 0}% &nbsp; Positive: {sentiment?.positive ?? 0}%</div>
      <SentimentChart timeline={sentiment?.timeline} summary={sentiment} />
    </div>
  );
}
