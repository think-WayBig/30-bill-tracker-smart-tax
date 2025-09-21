export const backdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50
}

export const modal: React.CSSProperties = {
  width: 700,
  maxWidth: '95vw',
  background: '#fff',
  borderRadius: 10,
  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
  overflow: 'hidden'
}

export const header: React.CSSProperties = {
  padding: '14px 18px',
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 700
}

export const body: React.CSSProperties = {
  padding: 18
}

export const footer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  padding: 16,
  borderTop: '1px solid #eee'
}

export const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  background: '#fff'
}

export const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, marginBottom: 6 }

export const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14
}

export const saveBtnStyle: (valid: boolean) => React.CSSProperties = (valid) => ({
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  background: valid ? '#4f46e5' : '#9aa0ff',
  color: '#fff',
  fontWeight: 700,
  cursor: valid ? 'pointer' : 'not-allowed'
})
