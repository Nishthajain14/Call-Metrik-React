export default function KeywordsTable({ keywords }) {
  const list = keywords || [];
  return (
    <div className="card p-3 overflow-x-auto">
      <table className="w-full text-sm table-glass table-zebra">
        <thead>
          <tr>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Weightage(%)</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row, i) => (
            <tr key={i}>
              <td className="py-2 pr-4 font-display text-neutral-900 dark:text-neutral-100">{row?.name || row?.keyword || row}</td>
              <td className="py-2 pr-4 font-body">{row?.weight || row?.weightage || '-'}</td>
            </tr>
          ))}
          {!list.length && (
            <tr><td className="py-3 text-neutral-500 dark:text-neutral-400" colSpan={2}>No keywords</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
