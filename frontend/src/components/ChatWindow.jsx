import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble.jsx';
import InputBar from './InputBar.jsx';

function ChatWindow({
  messages, loading, uploadLoading, docName, imageName, imagePreview,
  lastAnimatedId, onSend, onStop, onEditMessage, onUploadDoc, onUploadImage 
}) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, loading]);

  const hasMessages = messages.length > 0;

  return (
    <main className="chat-main">
      <div className="chat-header">
        <div>
          <div className="chat-header-title">Infollion AI</div>
          <div className="chat-header-subtitle">AI-powered assistant for document & image understanding</div>
        </div>
      </div>

      <div className="messages-area">
        {/* Welcome screen shown before any messages are sent */}
        {!hasMessages && (
          <div className="welcome-screen">
            <h2>Welcome to Infollion AI</h2>
          </div>
        )}

        {/* Map through the messages and render bubbles */}
        {messages.map((msg, i) => (
          <MessageBubble 
            key={msg.id || i}
            id={msg.id}
            role={msg.role} 
            text={msg.text} 
            image={msg.image} 
            // Animate only if this message matches the latest generated bot ID
            animate={msg.id === lastAnimatedId} 
            onEdit={onEditMessage} // Pass the edit function down for regenerating prompts
          />
        ))}

        {/* Typing indicator shown while the LLM generates a response */}
        {loading && (
          <div className="typing-indicator">
            <div className="msg-avatar">✦</div>
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        
        {/* Invisible div to target for auto-scrolling */}
        <div ref={bottomRef} />
      </div>

      {/* Input component containing text box and upload buttons */}
      <InputBar
        onSend={onSend}
        onStop={onStop} 
        onUploadDoc={onUploadDoc}
        onUploadImage={onUploadImage}
        loading={loading}
        docName={docName}
        imageName={imageName}
        imagePreview={imagePreview}
      />
    </main>
  );
}

export default ChatWindow;