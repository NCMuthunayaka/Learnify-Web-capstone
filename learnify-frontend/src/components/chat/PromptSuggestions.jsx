const prompts = ['Explain recursion simply', 'Make a study timetable', 'Quiz me on databases'];

const PromptSuggestions = ({ onSelect }) => (
  <div className="flex flex-wrap gap-2">
    {prompts.map((prompt) => (
      <button
        key={prompt}
        type="button"
        onClick={() => onSelect(prompt)}
        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
      >
        {prompt}
      </button>
    ))}
  </div>
);

export default PromptSuggestions;
