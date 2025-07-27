import React, { useEffect, useState } from 'react'

type SidebarProps = {
  setActiveScreen: (screen: string) => void
}

const billingSubPages = ['billing-pending', 'billing-paid']
const bookSubPages = [
  'book-entries-docs-complete',
  'book-entries-docs-incomplete',
  'book-entries-pending',
  'book-entries-completed'
]

const Sidebar: React.FC<SidebarProps> = ({ setActiveScreen }) => {
  const [hovered, setHovered] = useState<string | null>(null)
  const [active, setActive] = useState(() => {
    return localStorage.getItem('activeScreen') || 'add'
  })

  useEffect(() => {
    setActiveScreen(active)
  }, [active, setActiveScreen])

  const handleClick = (key: string) => {
    setActive(key)
    localStorage.setItem('activeScreen', key)
    setActiveScreen(key)
  }

  // Logic to show submenu if active is on a subpage
  const showBillingOptions = active === 'billing' || billingSubPages.includes(active)
  const showBookOptions = active === 'manage' || bookSubPages.includes(active)

  const renderButton = (
    key: string,
    label: string,
    icon: string,
    hasCaret = false,
    expanded = false
  ) => {
    const isActive =
      active === key ||
      (key === 'billing' && billingSubPages.includes(active)) ||
      (key === 'manage' && bookSubPages.includes(active))

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
        <span style={{ marginRight: '10px' }}>{icon}</span>
        {label}
        {hasCaret && <span style={{ marginLeft: 'auto' }}>{expanded ? '▾' : '▸'}</span>}
      </button>
    )
  }

  return (
    <div style={sidebarStyle}>
      <div style={titleStyle}>📚 Bill Tracker</div>

      {renderButton('add', 'Entry', '👤')}
      {renderButton('manage', 'Book', '📚', true, showBookOptions)}

      {showBookOptions && (
        <div style={{ marginLeft: '20px' }}>
          <div style={{ fontSize: '13px', marginBottom: '4px', color: '#6b7280' }}>📄 Docs</div>
          <button
            key="book-entries-docs-incomplete"
            onClick={() => handleClick('book-entries-docs-incomplete')}
            style={{
              ...subButtonStyle,
              backgroundColor:
                active === 'book-entries-docs-incomplete' ? '#e0e7ff' : 'transparent',
              fontWeight: active === 'book-entries-docs-incomplete' ? '600' : 'normal'
            }}
          >
            Incomplete
          </button>
          <button
            key="book-entries-docs-complete"
            onClick={() => handleClick('book-entries-docs-complete')}
            style={{
              ...subButtonStyle,
              backgroundColor: active === 'book-entries-docs-complete' ? '#e0e7ff' : 'transparent',
              fontWeight: active === 'book-entries-docs-complete' ? '600' : 'normal'
            }}
          >
            Complete
          </button>

          <div
            style={{ fontSize: '13px', marginTop: '8px', marginBottom: '4px', color: '#6b7280' }}
          >
            📄 ITR
          </div>
          <button
            key="book-entries-pending"
            onClick={() => handleClick('book-entries-pending')}
            style={{
              ...subButtonStyle,
              backgroundColor: active === 'book-entries-pending' ? '#e0e7ff' : 'transparent',
              fontWeight: active === 'book-entries-pending' ? '600' : 'normal'
            }}
          >
            Pending
          </button>
          <button
            key="book-entries-completed"
            onClick={() => handleClick('book-entries-completed')}
            style={{
              ...subButtonStyle,
              backgroundColor: active === 'book-entries-completed' ? '#e0e7ff' : 'transparent',
              fontWeight: active === 'book-entries-completed' ? '600' : 'normal'
            }}
          >
            Filed
          </button>
        </div>
      )}

      {renderButton('group', 'Groups', '📂')}
      {renderButton('billing', 'Billing', '💳', true, showBillingOptions)}

      {showBillingOptions && (
        <div style={{ marginLeft: '20px' }}>
          {['Pending', 'Paid'].map((status) => {
            const screenKey = `billing-${status.toLowerCase()}`
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

// Styles
const sidebarStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '10px',
  borderRight: '1px solid #ddd',
  width: '160px',
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
