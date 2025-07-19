import { useState } from 'react'
import Sidebar from './Sidebar'
import AddEntry from './AddEntry'
import ManageBook from './ManageBook'

const MainView = () => {
  const [activeScreen, setActiveScreen] = useState('add')

  return (
    <div style={{ display: 'flex', height: '95vh' }}>
      <Sidebar setActiveScreen={setActiveScreen} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {activeScreen === 'add' && <AddEntry />}
        {activeScreen === 'manage' && <ManageBook />}
      </div>
    </div>
  )
}

export default MainView
