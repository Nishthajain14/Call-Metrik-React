export default function TopicsTable({ topics }) {
  const list = topics || [];
  return (
    <div className="card p-3 overflow-x-auto">
      <table className="w-full text-sm table-glass table-zebra">
        <thead>
          <tr>
            <th className="py-2 pr-4">Topic</th>
            <th className="py-2 pr-4">Content</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row, i) => {
            const topic = row?.topic || row?.name || `Topic ${i + 1}`;
            const content = row?.content || row?.text || row?.summary || '';
            return (
              <tr key={i}>
                <td className="py-2 pr-4 align-top font-display text-neutral-900 dark:text-neutral-100">{topic}</td>
                <td className="py-2 pr-4 whitespace-pre-wrap font-body leading-6">{content}</td>
              </tr>
            );
          })}
          {!list.length && (
            <tr><td className="py-3 text-neutral-500 dark:text-neutral-400" colSpan={2}>No topics</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
