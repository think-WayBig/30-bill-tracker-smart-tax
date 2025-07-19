import React, { useState } from 'react'

type SidebarProps = {
  setActiveScreen: (screen: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ setActiveScreen }) => {
  const [hovered, setHovered] = useState<string | null>(null)
  const [active, setActive] = useState<string>('add') // default active screen

  const renderButton = (key: string, label: string, icon: string) => (
    <button
      onClick={() => {
        setActiveScreen(key)
        setActive(key)
      }}
      onMouseEnter={() => setHovered(key)}
      onMouseLeave={() => setHovered(null)}
      style={{
        ...buttonStyle,
        backgroundColor:
          active === key
            ? '#4f46e5' // Indigo background for active
            : hovered === key
              ? '#e0e7ff' // Light indigo on hover
              : 'transparent',
        color: active === key ? '#fff' : '#333',
        fontWeight: active === key ? '600' : 'normal'
      }}
    >
      <span style={{ marginRight: '10px' }}>{icon}</span> {label}
    </button>
  )

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
        borderRight: '1px solid #ddd',
        width: '240px',
        boxSizing: 'border-box',
        backgroundColor: '#f9fafb',
        boxShadow: '2px 0 6px rgba(0,0,0,0.05)'
      }}
    >
      <div
        style={{
          fontSize: '22px',
          marginBottom: '38px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        📚 Bill Tracker
      </div>

      {renderButton('add', 'Add Entry', '➕')}
      {renderButton('manage', 'Manage Book', '📖')}
      {renderButton('group', 'Manage Groups', '📂')}
      {renderButton('billing', 'Manage Billing', '🧾')}
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  border: 'none',
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: '16px',
  cursor: 'pointer',
  borderRadius: '8px',
  marginBottom: '10px',
  display: 'flex',
  alignItems: 'center',
  transition: 'background-color 0.2s ease, color 0.2s ease'
}

export default Sidebar
