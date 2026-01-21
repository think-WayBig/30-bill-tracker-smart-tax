/**
 * =========================================
 * Statements
 * ==========================================
 */
export const searchBarContainerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 69,
  zIndex: 10,
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  background: '#fff',
  padding: '12px',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  border: '1px solid #e5e7eb',
  marginBottom: 16,
  overflowX: 'auto'
}

export const searchBarStyle: React.CSSProperties = {
  flex: 1,
  height: 40,
  padding: '0 14px',
  fontSize: 14,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  outline: 'none'
}

export const importBtnStyle: React.CSSProperties = {
  height: 40,
  padding: '0 16px',
  fontSize: 14,
  fontWeight: 700,
  color: '#fff',
  background: '#6366f1',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'background 0.2s'
}

export const emptyStatementStyle = {
  marginTop: 16,
  padding: 16,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  background: '#fff',
  color: '#6b7280'
}

/**
 * =========================================
 * StatementsTable
 * ==========================================
 */
export const tableContainerStyle: React.CSSProperties = {
  marginTop: 12,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  overflow: 'hidden',
  overflowX: 'scroll',
  background: '#fff'
}

export const tableHeaderStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontWeight: 700,
  fontSize: 14,
  borderRight: '1px solid rgba(255,255,255,0.15)'
}

export const tableRowStyle: (rowIndex: number) => React.CSSProperties = (rowIndex: number) => ({
  borderTop: '1px solid #e5e7eb',
  background: rowIndex % 2 ? '#fafafa' : '#fff'
})

export const textAreaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 64,
  fontSize: 13,
  padding: '8px 10px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  outline: 'none',
  background: '#fff'
}

export const tableEmptyStyle: React.CSSProperties = {
  marginTop: 12,
  padding: 16,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  background: '#fff',
  color: '#6b7280'
}

export const deleteBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer'
}

export const fieldWrap: React.CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  gap: 4
}

export const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  opacity: 0.8,
  lineHeight: 1
}

export const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '220px 1fr auto',
  alignItems: 'end',
  gap: 20,
  padding: '12px 16px',
  borderRadius: 14,
  background: '#fff',
  boxShadow: '0 6px 18px rgba(0,0,0,0.06)'
}

export const nameStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 18,
  lineHeight: 1.1,
  alignSelf: 'center',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}

export const fieldsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(100px, 100px))',
  gap: 14,
  alignItems: 'end'
}

export const inputStyle: React.CSSProperties = {
  height: 36,
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  padding: '0 12px',
  outline: 'none',
  fontSize: 14,
  background: 'rgba(0,0,0,0.02)',
  width: '90px'
}

export const totalsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
  justifyContent: 'flex-end'
}

export const chip: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'baseline',
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(0,0,0,0.04)'
}

export const chipLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'rgba(0,0,0,0.65)'
}

export const chipValue: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: '#111'
}

export const chipValueNeg: React.CSSProperties = {
  ...chipValue,
  color: '#d32f2f'
}
