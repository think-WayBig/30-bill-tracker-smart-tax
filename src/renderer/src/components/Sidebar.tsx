import React, { useEffect, useState } from 'react'

type SidebarProps = {
  setActiveScreen: (screen: string) => void
}

const billingSubPages = ['billing-not-started', 'billing-pending', 'billing-paid']

const Sidebar: React.FC<SidebarProps> = ({ setActiveScreen }) => {
  const [hovered, setHovered] = useState<string | null>(null)
  const [active, setActive] = useState<string>(() => {
    return localStorage.getItem('activeScreen') || 'add'
  })

  // Automatically show nested billing items only if current screen is billing-related
  const showBillingOptions = active.startsWith('billing')

  useEffect(() => {
    setActiveScreen(active)
  }, [active, setActiveScreen])

  const handleClick = (key: string) => {
    setActive(key)
    localStorage.setItem('activeScreen', key)
    setActiveScreen(key)
  }

  const renderButton = (key: string, label: string, icon: string) => {
    const isActive = active === key || (key === 'billing' && billingSubPages.includes(active))

    return (
      <button
        key={key}
        onClick={() => handleClick(key)}
        onMouseEnter={() => setHovered(key)}
        onMouseLeave={() => setHovered(null)}
        style={{
          ...buttonStyle,
          backgroundColor: isActive ? '#4f46e5' : hovered === key ? '#e0e7ff' : 'transparent',
          color: isActive ? '#fff' : '#333',
          fontWeight: isActive ? '600' : 'normal'
        }}
      >
        <span style={{ marginRight: '10px' }}>{icon}</span> {label}
      </button>
    )
  }

  return (
    <div style={sidebarStyle}>
      <div style={titleStyle}>📚 Bill Tracker</div>

      {renderButton('add', 'Entry', '👤')}
      {renderButton('manage', 'Book', '📚')}
      {renderButton('group', 'Groups', '📂')}
      {renderButton('billing', 'Billing', '💳')}

      {showBillingOptions && (
        <div style={{ marginLeft: '20px', marginTop: '4px' }}>
          {['Not started', 'Pending', 'Paid'].map((status) => {
            const screenKey = `billing-${status.toLowerCase().replace(' ', '-')}`
            return (
              <button
                key={screenKey}
                onClick={() => handleClick(screenKey)}
                style={{
                  ...subButtonStyle,
                  backgroundColor: active === screenKey ? '#e0e7ff' : 'transparent',
                  fontWeight: active === screenKey ? '600' : 'normal'
                }}
              >
                {status}
              </button>
            )
          })}
        </div>
      )}

      {renderButton('settings', 'Settings', '⚙️')}
    </div>
  )
}

// Shared styles
const sidebarStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '10px',
  borderRight: '1px solid #ddd',
  width: '200px',
  boxSizing: 'border-box',
  backgroundColor: '#f9fafb',
  boxShadow: '2px 0 6px rgba(0,0,0,0.05)'
}

const titleStyle: React.CSSProperties = {
  fontSize: '22px',
  marginBottom: '38px',
  display: 'flex',
  alignItems: 'center'
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

const subButtonStyle: React.CSSProperties = {
  border: 'none',
  textAlign: 'left',
  padding: '8px 16px',
  fontSize: '15px',
  cursor: 'pointer',
  borderRadius: '6px',
  marginBottom: '8px',
  width: '100%',
  background: 'transparent'
}

export default Sidebar
