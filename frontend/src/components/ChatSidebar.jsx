import React, { useState } from 'react';

function ChatSidebar({ chatList, activeChatId, onNewChat, onSelectChat, onDeleteChat, onRenameChat }) {
  // State to track which chat item is currently being hovered over for the rename/delete icons
  const [hoveredChatId, setHoveredChatId] = useState(null);

  // Clean inline styles for the small action buttons
  const actionBtnStyle = {
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: '14px', padding: '2px', opacity: 0.8
  };

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="logo-icon">✦</div>
          <h1>Infollion AI</h1>
        </div>
        <button className="new-chat-btn" onClick={onNewChat}>
          <span>＋</span> New Chat
        </button>
      </div>

      <div className="sidebar-chats">
        {/* Empty state message if no history exists */}
        {chatList.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>No chats yet</p>}
        
        {/* Map through the saved chats */}
        {chatList.map((c) => (
          <div
            key={c.chat_id}
            className={`chat-item${c.chat_id === activeChatId ? ' active' : ''}`}
            onClick={() => onSelectChat(c.chat_id)}
            onMouseEnter={() => setHoveredChatId(c.chat_id)}
            onMouseLeave={() => setHoveredChatId(null)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            {/* Chat Icon and Preview Text */}
            <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              <span className="chat-item-icon">💬</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.preview}</span>
            </div>

            {/* Rename and Delete Actions (Only visible on hover) */}
            {hoveredChatId === c.chat_id && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={(e) => { e.stopPropagation(); onRenameChat(c.chat_id); }} style={actionBtnStyle} title="Rename">✏️</button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteChat(c.chat_id); }} style={actionBtnStyle} title="Delete">🗑️</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

export default ChatSidebar;