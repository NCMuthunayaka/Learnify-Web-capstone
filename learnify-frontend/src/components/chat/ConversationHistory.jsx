const ConversationHistory = () => {
  const conversations = ['Today', 'Study planning', 'React revision'];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
      <h2 className="mb-3 text-sm font-bold text-slate-500">Conversations</h2>
      <div className="space-y-2">
        {conversations.map((item) => (
          <button key={item} type="button" className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
            {item}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default ConversationHistory;
