import React, { useState, useRef, useCallback } from 'react';

function InputBar({ onSend, onStop, onUploadDoc, onUploadImage, loading, docName, imageName, imagePreview }) {
  // State for the text typed into the input field
  const [text, setText] = useState('');
  
  // References for the hidden file inputs and the textarea
  const docInputRef = useRef(null);
  const imgInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Handle sending the message
  const handleSend = useCallback(() => {
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setText('');
    
    // Reset textarea height after sending
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [text, loading, onSend]);

  // Handle pressing the Enter key to send (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle typing and auto-expanding the textarea height
  const handleTextChange = (e) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  return (
    <div className="input-bar-wrapper">
      {/* Show upload statuses if a document or image is attached */}
      {(docName || imageName) && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {docName && <div className="upload-status">📄 <span className="upload-name">{docName}</span></div>}
          {imageName && <div className="upload-status">🖼️ <span className="upload-name">{imageName}</span></div>}
        </div>
      )}

      <div className="input-bar" id="input-bar">
        {/* Hidden inputs triggered by the attachment buttons */}
        <input ref={docInputRef} type="file" accept=".pdf,.txt" className="hidden-input" onChange={(e) => { if(e.target.files[0]) onUploadDoc(e.target.files[0]); e.target.value=''; }} />
        <input ref={imgInputRef} type="file" accept=".png,.jpg,.jpeg" className="hidden-input" onChange={(e) => { if(e.target.files[0]) onUploadImage(e.target.files[0]); e.target.value=''; }} />

        {/* Attachment Buttons */}
        <div className="input-actions">
          <button className="action-btn" title="Upload Document" onClick={() => docInputRef.current?.click()} disabled={loading}>📄</button>
          <button className="action-btn" title="Upload Image" onClick={() => imgInputRef.current?.click()} disabled={loading}>🖼️</button>
        </div>

        {/* Main text input area */}
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Type a message…"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        {/* Send / Stop Buttons */}
        <div className="input-actions">
          {loading ? (
            // Show a red stop button while waiting for the LLM response
            <button className="action-btn send-btn" title="Stop generating" onClick={onStop} style={{ backgroundColor: '#ef4444' }}>
              ⏹️
            </button>
          ) : (
            // Standard send button
            <button className="action-btn send-btn" title="Send message" onClick={handleSend} disabled={!text.trim()}>
              ➤
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InputBar;