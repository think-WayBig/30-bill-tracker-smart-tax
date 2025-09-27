import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Entry from './book/Entry'
import Book from './book/Book'
import Group from './group/Group'
import Billing from './book/Billing'
import Settings from './Settings'
import Notices from './notices/Notices'
import GstTds from './gstTds/GstTds'
import CurrentStatements from './current_statements/Statements'
import SavingsStatements from './savings_statements/Statements'
import Audits from './audits/Audits'
import CurrentStatementsSummary from './current_statements/StatementsSummary'
import SavingsStatementsSummary from './savings_statements/StatementsSummary'

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

  useEffect(() => {
    const onNavigate = (e: Event) => {
      const screen = (e as CustomEvent).detail?.screen
      if (typeof screen === 'string') setActiveScreen(screen)
    }
    window.addEventListener('app:navigate', onNavigate as EventListener)
    return () => window.removeEventListener('app:navigate', onNavigate as EventListener)
  }, [])

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
        {activeScreen === 'excel' && <CurrentStatements />}
        {activeScreen === 'excel2' && <SavingsStatements />}
        {activeScreen === 'audits' && <Audits />}
        {activeScreen === 'current-statements-summary' && <CurrentStatementsSummary />}
        {activeScreen === 'savings-statements-summary' && <SavingsStatementsSummary />}
      </div>
    </div>
  )
}

export default MainView
