import Avatar from '../common/Avatar';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <Avatar name="Learnify AI" />}
      <div className={`max-w-2xl rounded-lg px-4 py-3 text-sm shadow-sm ${isUser ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}>
        <p className="whitespace-pre-wrap leading-6">{message.content}</p>
      </div>
      {isUser && <Avatar name="You" />}
    </div>
  );
};

export default ChatMessage;
