import { useState } from 'react'
import Sidebar from './Sidebar'
import AddEntry from './AddEntry'
import ManageBook from './ManageBook'
import ManageGroup from './ManageGroup'

const MainView = () => {
  const [activeScreen, setActiveScreen] = useState('add')

  return (
    <div style={{ display: 'flex', height: '95vh' }}>
      <Sidebar setActiveScreen={setActiveScreen} />
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#f3f4f6'
        }}
      >
        {activeScreen === 'add' && <AddEntry />}
        {activeScreen === 'manage' && <ManageBook />}
        {activeScreen === 'group' && <ManageGroup />}
      </div>
    </div>
  )
}

export default MainView
