import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import PromptSuggestions from './PromptSuggestions';
import TypingIndicator from './TypingIndicator';

const ChatWindow = ({ messages, isTyping, onSend }) => (
  <section className="flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      <PromptSuggestions onSelect={onSend} />
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isTyping && <TypingIndicator />}
    </div>
    <ChatInput onSend={onSend} disabled={isTyping} />
  </section>
);

export default ChatWindow;
