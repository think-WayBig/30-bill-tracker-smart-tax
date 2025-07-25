import React, { useEffect, useRef, useState } from 'react'

const Layout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [year, setYear] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const selectedYear = localStorage.getItem('selectedYear') || new Date().getFullYear().toString()
    setYear(selectedYear)
  }, [])

  const handleYearChange = (newYear: string) => {
    setYear(newYear)
    localStorage.setItem('selectedYear', newYear)
    setShowDropdown(false)
    window.location.reload() // ✅ Forces full page reload
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setShowDropdown(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const yearOptions = Array.from({ length: 11 }, (_, i) => (2020 + i).toString())

  return (
    <div>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#4f46e5',
          color: '#fff',
          fontSize: scrolled ? '1.3rem' : '1.5rem',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: scrolled ? '0.6rem 1.5rem' : '1rem 2rem',
          boxShadow: scrolled ? '0 2px 6px rgba(0, 0, 0, 0.1)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        <span>{title}</span>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            style={{
              backgroundColor: '#6366f1',
              padding: scrolled ? '6px 14px' : '8px 16px',
              borderRadius: '999px',
              fontSize: '1.1rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.3s ease'
            }}
          >
            Assessment Year: {`${year}-${(Number(year) + 1).toString().slice(-2)}`} ▾
          </button>

          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                backgroundColor: '#fff',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                overflow: 'hidden',
                minWidth: '130px', // reduced from 160px
                maxHeight: '160px', // reduced height
                overflowY: 'auto',
                scrollbarWidth: 'thin'
              }}
            >
              {yearOptions.map((y) => {
                const startYear = Number(y)
                const endYear = (startYear + 1).toString().slice(-2)
                return (
                  <div
                    key={y}
                    onClick={() => handleYearChange(y)}
                    style={{
                      padding: '6px 12px',
                      cursor: 'pointer',
                      backgroundColor: y === year ? '#e0e7ff' : '#fff',
                      color: '#333',
                      fontWeight: y === year ? 600 : 400,
                      fontSize: '0.9rem',
                      lineHeight: '1.3',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = y === year ? '#e0e7ff' : '#fff'
                    }}
                  >
                    {`${startYear}-${endYear}`}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </header>

      <main style={{ padding: '2rem' }}>{children}</main>
    </div>
  )
}

export default Layout
