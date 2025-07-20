import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Entry from './Entry'
import Book from './Book'
import Group from './Group'
import Billing from './Billing'
import Settings from './Settings'

const MainView = () => {
  const [activeScreen, setActiveScreen] = useState(() => {
    return localStorage.getItem('activeScreen') || 'add'
  })

  // Load saved screen on mount
  useEffect(() => {
    const saved = localStorage.getItem('activeScreen')
    if (saved) setActiveScreen(saved)
  }, [])

  // Save screen on change
  useEffect(() => {
    localStorage.setItem('activeScreen', activeScreen)
  }, [activeScreen])

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar setActiveScreen={setActiveScreen} />
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#f5f7ff'
        }}
      >
        {activeScreen === 'add' && <Entry />}
        {activeScreen === 'manage' && <Book />}
        {activeScreen === 'group' && <Group />}
        {activeScreen === 'billing' && <Billing />}
        {activeScreen === 'settings' && <Settings />}
      </div>
    </div>
  )
}

export default MainView
