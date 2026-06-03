import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatSidebar from './components/ChatSidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';

const API = 'https://infollion-ai.onrender.com'; 

function App() {
  const [allChats, setAllChats] = useState(() => {
    const saved = localStorage.getItem('gemini_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [docName, setDocName] = useState(null);
  const [imageName, setImageName] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [lastAnimatedId, setLastAnimatedId] = useState(null); 

  // --- NEW: Mobile Menu State ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('gemini_history', JSON.stringify(allChats));
  }, [allChats]);

  const currentChat = allChats.find((c) => c.chat_id === chatId);
  const messages = currentChat ? currentChat.history : [];
  const chatList = allChats.map((c) => ({ chat_id: c.chat_id, preview: c.preview }));

  const updateChatHistory = useCallback((targetChatId, newMsg) => {
    setAllChats((prev) => {
      const existingIndex = prev.findIndex((c) => c.chat_id === targetChatId);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          history: [...updated[existingIndex].history, newMsg]
        };
        return updated;
      } else {
        const previewText = newMsg.text ? newMsg.text.substring(0, 40) + '...' : 'File Upload...';
        return [{
          chat_id: targetChatId,
          preview: previewText,
          history: [newMsg]
        }, ...prev];
      }
    });
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const activeId = chatId || crypto.randomUUID();
    if (!chatId) setChatId(activeId);

    updateChatHistory(activeId, { id: crypto.randomUUID(), role: 'user', text });
    setLoading(true);
    
    setDocName(null);
    setImageName(null);
    setImagePreview(null);

    abortControllerRef.current = new AbortController();

    try {
      const form = new FormData();
      form.append('chat_id', activeId);
      form.append('message', text);

      const res = await fetch(`${API}/chat`, { 
        method: 'POST', 
        body: form,
        signal: abortControllerRef.current.signal 
      });
      const data = await res.json();

      const botMsgId = crypto.randomUUID();
      setLastAnimatedId(botMsgId); 
      updateChatHistory(activeId, { id: botMsgId, role: 'bot', text: data.reply });

    } catch (e) {
      if (e.name === 'AbortError') {
        updateChatHistory(activeId, { id: crypto.randomUUID(), role: 'bot', text: '🛑 *Generation stopped by user.*' });
      } else {
        updateChatHistory(activeId, { id: crypto.randomUUID(), role: 'bot', text: '⚠️ Network error.' });
      }
    } finally {
      setLoading(false);
    }
  }, [chatId, updateChatHistory]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); 
    }
  }, []);

  const editMessage = useCallback((msgId, newText) => {
    setAllChats(prev => {
      const chatIdx = prev.findIndex(c => c.chat_id === chatId);
      if (chatIdx === -1) return prev;
      
      const updated = [...prev];
      const history = updated[chatIdx].history;
      const msgIndex = history.findIndex(m => m.id === msgId);
      
      updated[chatIdx].history = history.slice(0, msgIndex);
      return updated;
    });

    sendMessage(newText);
  }, [chatId, sendMessage]);

  const deleteChat = useCallback((targetId) => {
    if (window.confirm("Delete this chat?")) {
      setAllChats(prev => prev.filter(c => c.chat_id !== targetId));
      if (chatId === targetId) resetChat(); 
    }
  }, [chatId]);

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
          role: 'user',
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
          role: 'user', 
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

  const resetChat = useCallback(() => {
    setChatId(null);
    setDocName(null);
    setImageName(null);
    setImagePreview(null);
    setLastAnimatedId(null); 
    setIsMobileMenuOpen(false); // Close sidebar on new chat
  }, []);

  const switchChat = useCallback((id) => {
    setChatId(id);
    setDocName(null);
    setImageName(null);
    setImagePreview(null);
    setLastAnimatedId(null); 
    setIsMobileMenuOpen(false); // Close sidebar on chat switch
  }, []);

  return (
    <div className="app-layout">
      
      {/* Mobile Hamburger Button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsMobileMenuOpen(true)}
      >
        ☰
      </button>

      {/* Dark Overlay for Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar Wrapper */}
      <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
        <ChatSidebar
          chatList={chatList}
          activeChatId={chatId}
          onNewChat={resetChat}
          onSelectChat={switchChat}
          onDeleteChat={deleteChat}
          onRenameChat={renameChat}
        />
      </div>

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