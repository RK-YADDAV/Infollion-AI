import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function MessageBubble({ id, role, text, image, animate, onEdit }) {
  const isUser = role === 'user';
  
  // State for typing effect, hover detection, and edit mode
  const [displayedText, setDisplayedText] = useState(animate ? '' : text);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  // Typewriter effect hook
  useEffect(() => {
    // If told not to animate, or if it's a user message, show the text immediately
    if (!animate || isUser) {
      setDisplayedText(text);
      return;
    }
    
    // Otherwise, stream the characters
    let index = 0;
    setDisplayedText(''); 
    const intervalId = setInterval(() => {
      index += 3; // Advance 3 characters per tick
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) clearInterval(intervalId);
    }, 15);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [text, animate, isUser]);

  // Handle copying text to the clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  // Handle saving the edited prompt
  const handleSaveEdit = () => {
    setIsEditing(false);
    onEdit(id, editText); // This triggers the slice and regenerate function in App.jsx
  };

  // Styles for the floating action menu and icons
  const actionMenuStyle = {
    position: 'absolute', top: '-12px', right: '10px',
    display: 'flex', gap: '4px', padding: '4px',
    background: 'var(--surface-elevated, #fff)', border: '1px solid var(--border, #ccc)',
    borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  };
  const iconBtnStyle = { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px' };

  return (
    <div 
      className={`message-row ${role}`} 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar Icon */}
      <div className="msg-avatar">{isUser ? '👤' : '✦'}</div>
      
      <div className="msg-content" style={{ position: 'relative' }}>
        
        {/* Toggle between Edit UI and Standard Text display */}
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minWidth: '300px' }}>
            <textarea 
              value={editText} 
              onChange={(e) => setEditText(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', minHeight: '80px', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
              <button onClick={() => setIsEditing(false)} style={{ padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ padding: '6px 12px', borderRadius: '4px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>Save & Submit</button>
            </div>
          </div>
        ) : (
          <>
            <ReactMarkdown>{displayedText}</ReactMarkdown>
            
            {/* Show image preview if attached */}
            {image && <img src={image} alt="Uploaded preview" className="msg-image-preview" />}
            
            {/* Floating menu: Show Copy & Edit icons ONLY on user messages when hovered */}
            {isUser && isHovered && (
              <div style={actionMenuStyle}>
                <button style={iconBtnStyle} onClick={handleCopy} title="Copy Text">📋</button>
                <button style={iconBtnStyle} onClick={() => setIsEditing(true)} title="Edit Prompt">✏️</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;