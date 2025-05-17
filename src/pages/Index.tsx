
import React from 'react';
import ChatInterface from '@/components/ChatInterface';

const Index: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 to-teal-50">
      <header className="py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-purple-900">Dynamic Knowledge Chatbot</h1>
          <p className="text-gray-600">A multi-agent system that adapts its knowledge to your sources</p>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8">
        <div className="h-full max-w-4xl mx-auto rounded-lg shadow-xl overflow-hidden border border-gray-200">
          <ChatInterface />
        </div>
      </main>

      <footer className="py-4 text-center text-gray-500 text-sm">
        <div className="max-w-4xl mx-auto">
          <p>Dynamic Source Chatbot with Multiple AI Agents</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
