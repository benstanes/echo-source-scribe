
// DOM Elements
const apiKeyContainer = document.getElementById('api-key-container');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeySubmit = document.getElementById('api-key-submit');
const chatInputArea = document.getElementById('chat-input-area');
const chatMessages = document.getElementById('chat-messages');
const sourceInput = document.getElementById('source-input');
const sourceSubmit = document.getElementById('source-submit');
const sourceButtonText = document.getElementById('source-button-text');
const sourceLoader = document.getElementById('source-loader');
const messageInput = document.getElementById('message-input');
const messageSubmit = document.getElementById('message-submit');
const clearKnowledge = document.getElementById('clear-knowledge');

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';
let API_KEY = localStorage.getItem('openai_api_key') || '';

// Chat state
let isProcessingSource = false;
let isTyping = false;
let typingRole = null;

// Initialize the application
function init() {
  // Check if API key is stored
  if (API_KEY) {
    validateApiKey(API_KEY);
  }
  
  // Add event listeners
  apiKeySubmit.addEventListener('click', handleApiKeySubmit);
  sourceSubmit.addEventListener('click', handleSourceSubmit);
  messageSubmit.addEventListener('click', handleMessageSubmit);
  clearKnowledge.addEventListener('click', handleClearKnowledge);
  
  // Enter key event listeners
  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleApiKeySubmit();
  });
  
  sourceInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSourceSubmit();
  });
  
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleMessageSubmit();
  });
  
  // Load messages from localStorage if available
  const savedMessages = localStorage.getItem('chat_messages');
  if (savedMessages) {
    const messages = JSON.parse(savedMessages);
    messages.forEach(message => {
      addMessageToUI(message);
    });
    scrollToBottom();
  }
}

// API Key Validation
async function validateApiKey(key) {
  try {
    const response = await fetch(`${API_BASE_URL}/validate-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ api_key: key })
    });
    
    const data = await response.json();
    
    if (data.valid) {
      API_KEY = key;
      localStorage.setItem('openai_api_key', key);
      
      // Show chat interface
      apiKeyContainer.style.display = 'none';
      chatInputArea.style.display = 'block';
      
      // Add system welcome message if no messages
      if (chatMessages.children.length === 0) {
        const systemMessage = {
          id: generateId(),
          role: 'system',
          content: 'Welcome! I\'m a multi-agent adaptive chatbot. I can learn from web sources you provide and answer your questions based on that knowledge. Start by adding a URL using the input field below.',
          timestamp: new Date().toISOString()
        };
        
        addMessageToUI(systemMessage);
        
        // Save to localStorage
        const messages = [systemMessage];
        localStorage.setItem('chat_messages', JSON.stringify(messages));
      }
    } else {
      alert('Invalid API key. Please check and try again.');
    }
  } catch (error) {
    console.error('Error validating API key:', error);
    alert('Error validating API key. Please try again later.');
  }
}

// Message Handling
function addMessageToUI(message) {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message', `message-${message.role.toLowerCase()}`);
  messageEl.setAttribute('data-id', message.id);
  
  // Create message content
  const contentEl = document.createElement('div');
  contentEl.classList.add('message-content');
  contentEl.textContent = message.content;
  
  // Create message metadata
  const metaEl = document.createElement('div');
  metaEl.classList.add('message-meta');
  
  const timeEl = document.createElement('div');
  timeEl.classList.add('message-time');
  const messageDate = new Date(message.timestamp);
  timeEl.textContent = messageDate.toLocaleTimeString();
  
  metaEl.appendChild(timeEl);
  
  // Add source URL if available
  if (message.sourceUrl) {
    const sourceUrlEl = document.createElement('a');
    sourceUrlEl.classList.add('message-source-url');
    sourceUrlEl.textContent = 'Source';
    sourceUrlEl.href = message.sourceUrl;
    sourceUrlEl.target = '_blank';
    metaEl.appendChild(sourceUrlEl);
  }
  
  messageEl.appendChild(contentEl);
  messageEl.appendChild(metaEl);
  
  chatMessages.appendChild(messageEl);
  scrollToBottom();
}

function showTypingIndicator(role) {
  if (isTyping) return;
  
  isTyping = true;
  typingRole = role;
  
  const typingEl = document.createElement('div');
  typingEl.classList.add('typing-indicator', `message-${role.toLowerCase()}`);
  typingEl.id = 'typing-indicator';
  
  const contentEl = document.createElement('div');
  contentEl.classList.add('message-content');
  
  const agentName = role.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  
  const nameSpan = document.createElement('span');
  nameSpan.textContent = `${agentName} is typing`;
  
  const dotsContainer = document.createElement('span');
  dotsContainer.classList.add('dots');
  
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    dotsContainer.appendChild(dot);
  }
  
  contentEl.appendChild(nameSpan);
  contentEl.appendChild(dotsContainer);
  
  typingEl.appendChild(contentEl);
  chatMessages.appendChild(typingEl);
  scrollToBottom();
}

function hideTypingIndicator() {
  isTyping = false;
  typingRole = null;
  
  const typingEl = document.getElementById('typing-indicator');
  if (typingEl) {
    typingEl.remove();
  }
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// API Handlers
async function handleApiKeySubmit() {
  const key = apiKeyInput.value.trim();
  if (!key) {
    alert('Please enter your OpenAI API key');
    return;
  }
  
  apiKeySubmit.disabled = true;
  await validateApiKey(key);
  apiKeySubmit.disabled = false;
}

async function handleSourceSubmit() {
  const url = sourceInput.value.trim();
  if (!url) {
    alert('Please enter a URL');
    return;
  }
  
  if (!isValidUrl(url)) {
    alert('Please enter a valid URL');
    return;
  }
  
  // Disable input and show loader
  setSourceProcessing(true);
  
  try {
    const response = await fetch(`${API_BASE_URL}/process-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        url: url,
        api_key: API_KEY
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Clear input
      sourceInput.value = '';
      
      // Update messages in UI
      updateMessagesFromResponse(data.messages);
    } else {
      alert('Error processing URL. Please try again.');
    }
  } catch (error) {
    console.error('Error processing URL:', error);
    alert('Error processing URL. Please try again later.');
  } finally {
    setSourceProcessing(false);
  }
}

async function handleMessageSubmit() {
  const message = messageInput.value.trim();
  if (!message) {
    alert('Please enter a message');
    return;
  }
  
  // Disable input
  messageSubmit.disabled = true;
  messageInput.disabled = true;
  
  try {
    const response = await fetch(`${API_BASE_URL}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: message,
        api_key: API_KEY
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Clear input
      messageInput.value = '';
      
      // Update messages in UI
      updateMessagesFromResponse(data.messages);
    } else {
      alert('Error sending message. Please try again.');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Error sending message. Please try again later.');
  } finally {
    // Re-enable input
    messageSubmit.disabled = false;
    messageInput.disabled = false;
  }
}

async function handleClearKnowledge() {
  if (!confirm('Are you sure you want to clear all knowledge sources?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/clear-knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update messages in UI
      updateMessagesFromResponse(data.messages);
    } else {
      alert('Error clearing knowledge. Please try again.');
    }
  } catch (error) {
    console.error('Error clearing knowledge:', error);
    alert('Error clearing knowledge. Please try again later.');
  }
}

// Helper Functions
function setSourceProcessing(isProcessing) {
  isProcessingSource = isProcessing;
  sourceInput.disabled = isProcessing;
  sourceSubmit.disabled = isProcessing;
  
  if (isProcessing) {
    sourceButtonText.style.display = 'none';
    sourceLoader.style.display = 'inline-block';
  } else {
    sourceButtonText.style.display = 'inline-block';
    sourceLoader.style.display = 'none';
  }
}

function updateMessagesFromResponse(messages) {
  // Get existing messages IDs
  const existingMessageIds = Array.from(
    document.querySelectorAll('.message')
  ).map(el => el.getAttribute('data-id'));
  
  // Add new messages
  const newMessages = messages.filter(
    message => !existingMessageIds.includes(message.id)
  );
  
  // Add typing animation for each message
  const addMessagesWithDelay = async () => {
    for (const message of newMessages) {
      // Simulate typing for agent messages
      if (message.role !== 'user') {
        showTypingIndicator(message.role);
        await new Promise(resolve => setTimeout(resolve, 1000));
        hideTypingIndicator();
      }
      
      addMessageToUI(message);
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };
  
  addMessagesWithDelay();
  
  // Update localStorage
  localStorage.setItem('chat_messages', JSON.stringify(messages));
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Initialize the app
init();
