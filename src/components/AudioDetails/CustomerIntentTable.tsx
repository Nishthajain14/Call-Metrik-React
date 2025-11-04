export default function CustomerIntentTable({ list, fallbackText }) {
  const rows = list || [];
  return (
    <div className="card p-3 overflow-x-auto">
      <table className="w-full text-sm table-glass table-zebra">
        <thead>
          <tr>
            <th className="py-2 pr-4">Intent</th>
            <th className="py-2 pr-4">Content</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="py-2 pr-4 align-top font-display text-neutral-900 dark:text-neutral-100">{row?.intent || row?.name || `Intent ${i + 1}`}</td>
              <td className="py-2 pr-4 whitespace-pre-wrap font-body leading-6">{row?.content || row?.text || ''}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td className="py-3 text-neutral-500 dark:text-neutral-400" colSpan={2}>{fallbackText || 'No customer intent data'}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
