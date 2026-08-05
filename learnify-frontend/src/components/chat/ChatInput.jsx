import { useState } from 'react';
import Button from '../common/Button';

const ChatInput = ({ onSend, disabled }) => {
  const [value, setValue] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!value.trim()) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <form onSubmit={submit} className="flex gap-3 border-t border-slate-200 bg-white p-4">
      <input
        className="min-w-0 flex-1 rounded-md border border-slate-200 px-4 py-2 outline-none focus:border-indigo-500"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask Learnify AI..."
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        Send
      </Button>
    </form>
  );
};

export default ChatInput;
