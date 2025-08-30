import React, { useEffect, useState } from 'react'

type SidebarProps = {
  setActiveScreen: (screen: string) => void
}

const billingSubPages = ['billing-pending', 'billing-paid']
const bookSubPages = [
  'book-entries-docs-complete',
  'book-entries-docs-incomplete',
  'book-entries-completed'
]

const EXPANDED_W = 200
const COLLAPSED_W = 56

// at top (near constants)
const PURPLE = '#4f46e5'
const TDS_ACCENT = '#038260ff'
const getTaxesAccent = () =>
  localStorage.getItem('taxes.activeTab') === 'TDS' ? TDS_ACCENT : PURPLE

const Sidebar: React.FC<SidebarProps> = ({ setActiveScreen }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [active, setActive] = useState(() => localStorage.getItem('activeScreen') || 'add')
  const [closeHover, setCloseHover] = useState(false)

  // “Pinned collapsed” flag; when true, it stays thin until you hover (then temporarily expands)
  // When false, it stays expanded always.
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === '1')

  const [taxesAccent, setTaxesAccent] = useState(getTaxesAccent())

  // Hover over the sidebar expands it even if collapsed
  const [hovering, setHovering] = useState(false)
  const isExpanded = !collapsed || hovering

  useEffect(() => {
    setActiveScreen(active)
  }, [active, setActiveScreen])

  // effects (anywhere inside component)
  useEffect(() => {
    const onTaxesTabChanged = () => setTaxesAccent(getTaxesAccent())
    window.addEventListener('taxes:tab-changed', onTaxesTabChanged)
    return () => window.removeEventListener('taxes:tab-changed', onTaxesTabChanged)
  }, [])

  useEffect(() => {
    // refresh when sidebar is hovered or when user switches to the taxes screen
    if (hovering || active === 'taxes') setTaxesAccent(getTaxesAccent())
  }, [hovering, active])

  const handleClick = (key: string) => {
    setActive(key)
    localStorage.setItem('activeScreen', key)
    setActiveScreen(key)
  }

  const togglePinned = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebarCollapsed', next ? '1' : '0')
      return next
    })
  }

  // Show submenu only when expanded, or when parent is the active route (but still hidden if not expanded)
  const showBillingOptions =
    isExpanded && (active === 'billing' || billingSubPages.includes(active))
  const showBookOptions = isExpanded && (active === 'manage' || bookSubPages.includes(active))

  const renderButton = (
    key: string,
    label: string,
    icon: string,
    hasCaret = false,
    expanded = false,
    activeBg?: string
  ) => {
    const isActive =
      active === key ||
      (key === 'billing' && billingSubPages.includes(active)) ||
      (key === 'manage' && bookSubPages.includes(active))

    return (
      <button
        key={key}
        onClick={() => handleClick(key)}
        onMouseEnter={() => setHoveredItem(key)}
        onMouseLeave={() => setHoveredItem(null)}
        title={!isExpanded ? label : undefined}
        style={{
          ...buttonStyle,
          ...(isExpanded ? {} : collapsedButtonStyle),
          backgroundColor: isActive
            ? (activeBg ?? PURPLE)
            : hoveredItem === key
              ? '#e0e7ff'
              : 'transparent',
          color: isActive ? '#fff' : '#333',
          fontWeight: isActive ? 600 : 'normal',
          width: '100%'
        }}
      >
        <span style={{ marginRight: isExpanded ? 10 : 0 }}>{icon}</span>
        {isExpanded && <span>{label}</span>}
        {hasCaret && isExpanded && (
          <span style={{ marginLeft: 'auto' }}>{expanded ? '▾' : '▸'}</span>
        )}
      </button>
    )
  }

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        ...sidebarStyle,
        width: isExpanded ? EXPANDED_W : COLLAPSED_W,
        padding: isExpanded ? '10px' : '10px 8px',
        alignItems: isExpanded ? 'stretch' : 'center',
        transition: 'width 340ms ease, padding 340ms ease'
      }}
    >
      {/* Header / Title + pin toggle */}
      <div style={{ ...titleRowStyle, justifyContent: isExpanded ? 'space-between' : 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📚</span>
          {isExpanded && <span style={titleTextStyle}>Bill Tracker</span>}
        </div>
        <button
          onClick={togglePinned}
          aria-label={
            collapsed
              ? 'Pinned (expand on hover). Click to keep open'
              : 'Unpinned (always open). Click to collapse on hover'
          }
          title={
            collapsed
              ? 'Expand on hover (pinned). Click to keep open'
              : 'Always open. Click to make hover-expand'
          }
          style={{
            ...collapseBtnStyle,
            marginLeft: isExpanded ? 'auto' : 0
          }}
        >
          {collapsed ? '📌' : '📍'}
        </button>
      </div>

      {renderButton('add', 'Entry', '👤')}
      {renderButton('manage', 'Book', '📚', true, showBookOptions)}

      {showBookOptions && (
        <div style={{ marginLeft: 20 }}>
          <button
            key="book-entries-docs-incomplete"
            onClick={() => handleClick('book-entries-docs-incomplete')}
            style={{
              ...subButtonStyle,
              backgroundColor:
                active === 'book-entries-docs-incomplete' ? '#e0e7ff' : 'transparent',
              fontWeight: active === 'book-entries-docs-incomplete' ? 600 : 'normal'
            }}
          >
            Assessee List
          </button>
          <div style={{ fontSize: 13, marginTop: 8, marginBottom: 4, color: '#6b7280' }}>
            📄 ITR
          </div>
          <button
            key="book-entries-docs-complete"
            onClick={() => handleClick('book-entries-docs-complete')}
            style={{
              ...subButtonStyle,
              backgroundColor: active === 'book-entries-docs-complete' ? '#e0e7ff' : 'transparent',
              fontWeight: active === 'book-entries-docs-complete' ? 600 : 'normal'
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
              fontWeight: active === 'book-entries-completed' ? 600 : 'normal'
            }}
          >
            Filed
          </button>
        </div>
      )}

      {renderButton('group', 'Groups', '📂')}
      {renderButton('billing', 'Billing', '💳', true, showBillingOptions)}

      {showBillingOptions && (
        <div style={{ marginLeft: 20 }}>
          {['Pending', 'Paid'].map((status) => {
            const screenKey = `billing-${status.toLowerCase()}`
            return (
              <button
                key={screenKey}
                onClick={() => handleClick(screenKey)}
                style={{
                  ...subButtonStyle,
                  backgroundColor: active === screenKey ? '#e0e7ff' : 'transparent',
                  fontWeight: active === screenKey ? 600 : 'normal'
                }}
              >
                {status}
              </button>
            )
          })}
        </div>
      )}

      {renderButton('notices', 'Notices', '📬')}
      {renderButton('taxes', 'GST/TDS', '📝', false, false, taxesAccent)}
      {renderButton('excel', 'Statements', '🏦')}

      <div style={{ marginTop: 'auto', width: '100%' }}>
        {renderButton('settings', 'Settings', '⚙️')}
      </div>

      <button
        onClick={() => window.close()}
        title="Close"
        style={{
          ...closeButtonStyle,
          backgroundColor: closeHover ? '#dc2626' : 'transparent',
          color: closeHover ? 'white' : '#000'
        }}
        onMouseEnter={() => setCloseHover(true)}
        onMouseLeave={() => setCloseHover(false)}
      >
        {isExpanded ? '❌ Close' : '❌'}
      </button>
    </div>
  )
}

/* ===== Styles ===== */
const sidebarStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid #ddd',
  boxSizing: 'border-box',
  backgroundColor: '#f9fafb',
  boxShadow: '2px 0 6px rgba(0,0,0,0.05)'
}

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 18
}

const titleTextStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600
}

const buttonStyle: React.CSSProperties = {
  border: 'none',
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: 16,
  cursor: 'pointer',
  borderRadius: 8,
  marginBottom: 10,
  display: 'flex',
  alignItems: 'center',
  transition: 'background-color 0.2s ease, color 0.2s ease'
}

const collapsedButtonStyle: React.CSSProperties = {
  justifyContent: 'center',
  padding: '12px 0'
}

const subButtonStyle: React.CSSProperties = {
  border: 'none',
  textAlign: 'left',
  padding: '8px 16px',
  fontSize: 15,
  cursor: 'pointer',
  borderRadius: 6,
  marginBottom: 8,
  width: '100%',
  background: 'transparent'
}

const closeButtonStyle: React.CSSProperties = {
  border: '2px solid #dc2626',
  backgroundColor: 'transparent',
  color: '#000',
  fontSize: 15,
  padding: '10px 16px',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease'
}

const collapseBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  padding: 6,
  borderRadius: 6,
  transition: 'background-color 0.2s ease, color 0.2s ease'
}

export default Sidebar
