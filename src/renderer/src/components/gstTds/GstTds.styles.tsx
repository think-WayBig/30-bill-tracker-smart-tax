export const dialogCardStyle: React.CSSProperties = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  width: 'min(560px, 92vw)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  position: 'relative',
  zoom: 1.3
}

export const dialogHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 4
}

export const dialogTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: '#111827'
}

export const closeBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 22,
  lineHeight: 1,
  cursor: 'pointer',
  color: '#6b7280',
  padding: 4,
  margin: -4,
  borderRadius: 6
}

export const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12
}

export const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
}

export const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#374151'
}

export const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  fontSize: 14
}

export const footerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'flex-end',
  marginTop: 4
}

export const secondaryBtnStyle: React.CSSProperties = {
  ...inputBaseStyle,
  padding: '8px 14px',
  borderRadius: 8,
  background: '#f3f4f6',
  border: '1px solid #e5e7eb',
  cursor: 'pointer'
}

export const primaryBtnStyle: React.CSSProperties = {
  ...inputBaseStyle,
  padding: '8px 14px',
  borderRadius: 8,
  background: '#6366f1',
  color: '#fff',
  border: '1px solid #6366f1',
  cursor: 'pointer'
}
