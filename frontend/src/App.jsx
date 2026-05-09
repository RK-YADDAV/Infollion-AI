import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatSidebar from './components/ChatSidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';

// Proxy API endpoint (handled by Vite)
const API = 'https://infollion-ai.onrender.com'; 

function App() {
  // Initialize chat history from the browser's LocalStorage
  const [allChats, setAllChats] = useState(() => {
    const saved = localStorage.getItem('gemini_history');
    return saved ? JSON.parse(saved) : [];
  });

  // State variables for managing the active chat and UI loading states
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [docName, setDocName] = useState(null);
  const [imageName, setImageName] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Tracks which specific message should have the typing animation applied
  const [lastAnimatedId, setLastAnimatedId] = useState(null); 

  // Reference to cancel the API request mid-flight if the user clicks Stop
  const abortControllerRef = useRef(null);

  // Automatically save history to LocalStorage whenever allChats state changes
  useEffect(() => {
    localStorage.setItem('gemini_history', JSON.stringify(allChats));
  }, [allChats]);

  // Derived state: find the current chat and its messages based on the active chatId
  const currentChat = allChats.find((c) => c.chat_id === chatId);
  const messages = currentChat ? currentChat.history : [];
  const chatList = allChats.map((c) => ({ chat_id: c.chat_id, preview: c.preview }));

  // Helper function to update the history of a specific chat without mutating state
  const updateChatHistory = useCallback((targetChatId, newMsg) => {
    setAllChats((prev) => {
      const existingIndex = prev.findIndex((c) => c.chat_id === targetChatId);
      if (existingIndex !== -1) {
        // Chat exists, deeply copy and append the new message
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          history: [...updated[existingIndex].history, newMsg]
        };
        return updated;
      } else {
        // Brand new chat, create a new object in the array
        const previewText = newMsg.text ? newMsg.text.substring(0, 40) + '...' : 'File Upload...';
        return [{
          chat_id: targetChatId,
          preview: previewText,
          history: [newMsg]
        }, ...prev];
      }
    });
  }, []);

  // Function to send a prompt to the backend
  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    // Create a new ID if a chat hasn't been started yet
    const activeId = chatId || crypto.randomUUID();
    if (!chatId) setChatId(activeId);

    // Save the user's message instantly
    updateChatHistory(activeId, { id: crypto.randomUUID(), role: 'user', text });
    setLoading(true);
    
    // Clear upload previews from the input bar after sending
    setDocName(null);
    setImageName(null);
    setImagePreview(null);

    // Initialize the abort controller for the stop button
    abortControllerRef.current = new AbortController();

    try {
      const form = new FormData();
      form.append('chat_id', activeId);
      form.append('message', text);

      // Fetch with the abort signal attached
      const res = await fetch(`${API}/chat`, { 
        method: 'POST', 
        body: form,
        signal: abortControllerRef.current.signal 
      });
      const data = await res.json();

      // Trigger animation for the successful bot response
      const botMsgId = crypto.randomUUID();
      setLastAnimatedId(botMsgId); 
      updateChatHistory(activeId, { id: botMsgId, role: 'bot', text: data.reply });

    } catch (e) {
      // Check if the error was caused by the user clicking the Stop button
      if (e.name === 'AbortError') {
        updateChatHistory(activeId, { id: crypto.randomUUID(), role: 'bot', text: '🛑 *Generation stopped by user.*' });
      } else {
        updateChatHistory(activeId, { id: crypto.randomUUID(), role: 'bot', text: '⚠️ Network error.' });
      }
    } finally {
      setLoading(false);
    }
  }, [chatId, updateChatHistory]);

  // Function to stop the LLM generation midway
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Triggers the AbortError in the fetch catch block
    }
  }, []);

  // Function to edit a previous prompt and regenerate the response
  const editMessage = useCallback((msgId, newText) => {
    // Slice off the old messages starting from the edited message
    setAllChats(prev => {
      const chatIdx = prev.findIndex(c => c.chat_id === chatId);
      if (chatIdx === -1) return prev;
      
      const updated = [...prev];
      const history = updated[chatIdx].history;
      const msgIndex = history.findIndex(m => m.id === msgId);
      
      // Keep only history BEFORE the edited message
      updated[chatIdx].history = history.slice(0, msgIndex);
      return updated;
    });

    // Send the edited prompt as a brand new message
    sendMessage(newText);
  }, [chatId, sendMessage]);

  // Function to delete an entire chat from the sidebar
  const deleteChat = useCallback((targetId) => {
    if (window.confirm("Delete this chat?")) {
      setAllChats(prev => prev.filter(c => c.chat_id !== targetId));
      if (chatId === targetId) resetChat(); // Reset main window if deleting active chat
    }
  }, [chatId]);

  // Function to rename a chat in the sidebar
  const renameChat = useCallback((targetId) => {
    const newName = window.prompt("Enter a new name for this chat:");
    if (newName && newName.trim()) {
      setAllChats(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(c => c.chat_id === targetId);
        if (idx !== -1) updated[idx].preview = newName.trim();
        return updated;
      });
    }
  }, []);

  // Function to upload a document
  const uploadDoc = useCallback(async (file) => {
    setUploadLoading(true);
    const activeId = chatId || crypto.randomUUID();
    if (!chatId) setChatId(activeId);

    try {
      const form = new FormData();
      form.append('chat_id', activeId);
      form.append('file', file);

      const res = await fetch(`${API}/upload-doc`, { method: 'POST', body: form });
      const data = await res.json();
      const msgId = crypto.randomUUID();

      if (res.ok) {
        setDocName(data.filename);
        updateChatHistory(activeId, { 
          id: msgId,
          role: 'user', // Set as user so it appears on the right side
          text: `📄 Document **${data.filename}** attached (${data.char_count.toLocaleString()} chars).` 
        });
      } else {
        updateChatHistory(activeId, { id: msgId, role: 'bot', text: `⚠️ Upload failed: ${data.detail}` });
      }
    } catch (e) {
      updateChatHistory(activeId, { id: crypto.randomUUID(), role: 'bot', text: '⚠️ Upload failed.' });
    } finally {
      setUploadLoading(false);
    }
  }, [chatId, updateChatHistory]);

  // Function to upload an image
  const uploadImage = useCallback(async (file) => {
    setUploadLoading(true);
    const activeId = chatId || crypto.randomUUID();
    if (!chatId) setChatId(activeId);

    try {
      const form = new FormData();
      form.append('chat_id', activeId);
      form.append('file', file);

      const res = await fetch(`${API}/upload-image`, { method: 'POST', body: form });
      const data = await res.json();
      const msgId = crypto.randomUUID();

      if (res.ok) {
        setImageName(data.filename);
        setImagePreview(data.preview);
        updateChatHistory(activeId, { 
          id: msgId,
          role: 'user', // Set as user so it appears on the right side
          text: `🖼️ Image **${data.filename}** attached.`, 
          image: data.preview 
        });
      } else {
        updateChatHistory(activeId, { id: msgId, role: 'bot', text: `⚠️ Upload failed: ${data.detail}` });
      }
    } catch (e) {
      updateChatHistory(activeId, { id: crypto.randomUUID(), role: 'bot', text: '⚠️ Upload failed.' });
    } finally {
      setUploadLoading(false);
    }
  }, [chatId, updateChatHistory]);

  // Function to reset UI for a new chat
  const resetChat = useCallback(() => {
    setChatId(null);
    setDocName(null);
    setImageName(null);
    setImagePreview(null);
    setLastAnimatedId(null); 
  }, []);

  // Function to switch to an existing chat tab
  const switchChat = useCallback((id) => {
    setChatId(id);
    setDocName(null);
    setImageName(null);
    setImagePreview(null);
    setLastAnimatedId(null); // Clears animation when clicking old tabs
  }, []);

  return (
    <div className="app-layout">
      <ChatSidebar
        chatList={chatList}
        activeChatId={chatId}
        onNewChat={resetChat}
        onSelectChat={switchChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
      />
      <ChatWindow
        messages={messages}
        loading={loading}
        uploadLoading={uploadLoading}
        docName={docName}
        imageName={imageName}
        imagePreview={imagePreview}
        lastAnimatedId={lastAnimatedId} 
        onSend={sendMessage}
        onStop={stopGeneration}
        onEditMessage={editMessage}
        onUploadDoc={uploadDoc}
        onUploadImage={uploadImage}
      />
    </div>
  );
}

export default App;