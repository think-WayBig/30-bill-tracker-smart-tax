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
  background: '#d30043ff',
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
