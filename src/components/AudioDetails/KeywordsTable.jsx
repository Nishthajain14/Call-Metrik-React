export default function KeywordsTable({ keywords }) {
  const list = keywords || [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-neutral-300">
          <tr>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Weightage(%)</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row, i) => (
            <tr key={i} className="border-t border-neutral-800">
              <td className="py-2 pr-4">{row?.name || row?.keyword || row}</td>
              <td className="py-2 pr-4">{row?.weight || row?.weightage || '-'}</td>
            </tr>
          ))}
          {!list.length && (
            <tr><td className="py-3 text-neutral-400" colSpan={2}>No keywords</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
