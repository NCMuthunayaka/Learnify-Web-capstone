import ChatWindow from '../components/chat/ChatWindow';
import ConversationHistory from '../components/chat/ConversationHistory';
import { useChat } from '../hooks/useChat';

const AIChatPage = () => {
  const { messages, isTyping, sendMessage } = useChat();

  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
      <ConversationHistory />
      <ChatWindow messages={messages} isTyping={isTyping} onSend={sendMessage} />
    </div>
  );
};

export default AIChatPage;
