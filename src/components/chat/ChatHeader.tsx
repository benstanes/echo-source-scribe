
import React from 'react';

const ChatHeader: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-t-lg border-b border-gray-200">
      <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-700 via-blue-600 to-teal-500 bg-clip-text text-transparent">
        Multi-Agent Adaptive Chatbot
      </h1>
      <p className="text-center text-gray-500">
        Provide web sources and ask questions. I'll learn dynamically from the sources you share.
      </p>
    </div>
  );
};

export default ChatHeader;
