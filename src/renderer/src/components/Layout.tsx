import React from 'react'

const Layout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ backgroundColor: '#f5f7ff', minHeight: '100vh' }}>
    <header
      style={{
        padding: '1rem 2rem',
        backgroundColor: '#4f46e5',
        color: '#fff',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}
    >
      {title}
    </header>
    <main style={{ padding: '2rem' }}>{children}</main>
  </div>
)

export default Layout
