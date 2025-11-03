export default function TopicsTable({ topics }) {
  const list = topics || [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-neutral-600 dark:text-neutral-300">
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
              <tr key={i} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="py-2 pr-4 align-top">{topic}</td>
                <td className="py-2 pr-4 whitespace-pre-wrap">{content}</td>
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
