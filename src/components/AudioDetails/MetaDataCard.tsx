export default function MetaDataCard({ insights }) {
  return (
    <div className="card p-4">
      <div className="font-semibold mb-3">Meta Data</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <div>File Name : {insights?.fileName || '-'}</div>
          <div>File Type : {insights?.fileType || '-'}</div>
          <div>File Size : {insights?.fileSize || '-'}</div>
          <div>File Duration (HH:MM:SS) : {insights?.fileDuration || '-'}</div>
          <div>Agent Name : {insights?.executiveName || '-'}</div>
        </div>
        <div>
          <div>Upload Source : {insights?.uploadSource ? <span title={insights.uploadSource}>🔗</span> : '-'}</div>
          <div>Language (translated) : {Array.isArray(insights?.language) ? `[${insights.language.filter(Boolean).join(', ')}]` : (insights?.language || '-')}</div>
          <div>Create Date : {insights?.createdDate || '-'}</div>
          <div>Audio ID : {insights?.audioId || '-'}</div>
          <div>Call Status : {insights?.callStatus || '-'}</div>
        </div>
        <div>
          <div>Agent Score : {insights?.executiveScore ?? '-'}</div>
          <div>Agent Weighted Score : {insights?.executiveWeightedScore ?? '-'}</div>
          <div>Talk to Listen ratio</div>
          <div className="pl-3">Customer: {insights?.talkListen?.customer ?? '-'}</div>
          <div className="pl-3">Agent: {insights?.talkListen?.agent ?? '-'}</div>
        </div>
      </div>
    </div>
  );
}
