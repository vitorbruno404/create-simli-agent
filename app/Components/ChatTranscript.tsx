import React from 'react';

interface Message {
  role: 'agent' | 'user';
  content: string;
  timestamp: string;
}

interface ChatTranscriptProps {
  messages: Message[];
}

const ChatTranscript: React.FC<ChatTranscriptProps> = ({ messages }) => {
  return (
    <div className="w-[350px] h-[200px] bg-black border border-white rounded-lg p-4 mt-4 overflow-y-auto">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div key={index} className="text-white">
            <span className="font-bold">
              {message.role === 'agent' ? 'Ola Nordman: ' : 'User: '}
            </span>
            <span className="text-gray-300">{message.content}</span>
            <span className="text-xs text-gray-500 ml-2">
              {message.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatTranscript; 