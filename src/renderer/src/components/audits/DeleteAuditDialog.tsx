// ./DeleteAuditDialog.tsx
import React, { useState, useEffect } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (pan: string) => void
}

const dialogStyles: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
}

const cardStyles: React.CSSProperties = {
  background: 'white',
  borderRadius: 12,
  padding: 16,
  width: 380,
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
}

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  outline: 'none',
  marginTop: 6
}

const footerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 16
}

const btnBase: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  border: 'none'
}

const DeleteAuditDialog: React.FC<Props> = ({ open, onClose, onConfirm }) => {
  const [pan, setPan] = useState('')

  useEffect(() => {
    if (open) setPan('')
  }, [open])

  if (!open) return null

  return (
    <div style={dialogStyles} onClick={onClose}>
      <div style={cardStyles} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0, marginBottom: 10 }}>Delete Audit Entry</h3>
        <p style={{ margin: 0, color: '#4b5563' }}>
          Enter the PAN of the entry you want to delete.
        </p>
        <input
          autoFocus
          placeholder="PAN (e.g. ABCDE1234F)"
          value={pan}
          onChange={(e) => setPan(e.target.value)}
          style={inputStyles}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && pan.trim()) onConfirm(pan.trim())
          }}
        />
        <div style={footerStyles}>
          <button style={{ ...btnBase, background: '#e5e7eb' }} onClick={onClose}>
            Cancel
          </button>
          <button
            style={{ ...btnBase, background: '#ef4444', color: 'white' }}
            onClick={() => pan.trim() && onConfirm(pan.trim())}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteAuditDialog
