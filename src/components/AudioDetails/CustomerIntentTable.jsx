export default function CustomerIntentTable({ list, fallbackText }) {
  const rows = list || [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-neutral-300">
          <tr>
            <th className="py-2 pr-4">Intent</th>
            <th className="py-2 pr-4">Content</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-neutral-800">
              <td className="py-2 pr-4 align-top">{row?.intent || row?.name || `Intent ${i + 1}`}</td>
              <td className="py-2 pr-4 whitespace-pre-wrap">{row?.content || row?.text || ''}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td className="py-3 text-neutral-400" colSpan={2}>{fallbackText || 'No customer intent data'}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
