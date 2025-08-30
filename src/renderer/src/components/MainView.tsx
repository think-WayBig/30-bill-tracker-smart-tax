import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Entry from './Entry'
import Book from './Book'
import Group from './Group'
import Billing from './Billing'
import Settings from './Settings'
import Notices from './Notices'
import GstTds from './GstTds'
import Statements from './Statements'

const MainView = () => {
  const [activeScreen, setActiveScreen] = useState(() => {
    return localStorage.getItem('activeScreen') || 'add'
  })

  useEffect(() => {
    const saved = localStorage.getItem('activeScreen')
    if (saved) setActiveScreen(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('activeScreen', activeScreen)
  }, [activeScreen])

  const isBillingScreen = activeScreen.startsWith('billing')
  const isBookScreen =
    activeScreen === 'manage' ||
    activeScreen === 'book-entries-docs-complete' ||
    activeScreen === 'book-entries-docs-incomplete' ||
    activeScreen === 'book-entries-pending' ||
    activeScreen === 'book-entries-completed'

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar setActiveScreen={setActiveScreen} />
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f5f7ff' }}>
        {activeScreen === 'add' && <Entry />}
        {isBookScreen && <Book activeScreen={activeScreen} />}
        {activeScreen === 'group' && <Group />}
        {isBillingScreen && <Billing activeScreen={activeScreen} />}
        {activeScreen === 'settings' && <Settings />}
        {activeScreen === 'notices' && <Notices />}
        {activeScreen === 'taxes' && <GstTds />}
        {activeScreen === 'excel' && <Statements />}
      </div>
    </div>
  )
}

export default MainView
