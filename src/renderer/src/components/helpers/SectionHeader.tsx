// SectionHeader.tsx
import React from 'react'

type SectionHeaderProps = {
  title: string
  description: string
  align?: 'left' | 'center' | 'right'
  color?: string
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  align = 'left',
  color = '#4f46e5'
}) => {
  return (
    <div style={{ textAlign: align }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color }}>{title}</h1>
      <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '1.5rem' }}>{description}</p>
    </div>
  )
}
