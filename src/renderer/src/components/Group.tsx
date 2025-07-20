import { useEffect, useState } from 'react'
import Layout from './Layout'

interface User {
  name: string
  pan: string
  fileCode: string
  group?: string
}

const Group = () => {
  const [groups, setGroups] = useState<string[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [newGroup, setNewGroup] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Load users and groups from files
    const fetchData = async () => {
      const loadedUsers = await window.electronAPI.loadEntries()
      setUsers(loadedUsers)

      const loadedGroups = await window.electronAPI.loadGroups()
      setGroups(loadedGroups)
    }

    fetchData()
  }, [])

  const handleCreateGroup = async () => {
    const trimmed = newGroup.trim()
    if (!trimmed) return

    const res = await window.electronAPI.saveGroup(trimmed)
    if (res.success) {
      const updatedGroups = await window.electronAPI.loadGroups()
      setGroups(updatedGroups)
      setNewGroup('')
      alert('Group created successfully!')
    } else {
      alert(res.error || 'Failed to create group')
    }
  }

  const handleGroupChange = (pan: string, group: string) => {
    const updatedUsers = users.map((u) => (u.pan === pan ? { ...u, group } : u))
    setUsers(updatedUsers)
    window.electronAPI.saveEntries(updatedUsers)
  }

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase()
    return (
      user.fileCode.toLowerCase().includes(search) ||
      user.name.toLowerCase().includes(search) ||
      user.pan.toLowerCase().includes(search) ||
      (user.group?.toLowerCase() || '').includes(search)
    )
  })

  return (
    <Layout title="📂 Manage Groups">
      <style>
        {`
          .group-row:hover {
            background-color: #eef2ff;
          }
        `}
      </style>

      {/* Search bar and Group creation */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search Entry"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '16px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            flex: '1 1 300px',
            outline: 'none'
          }}
        />

        <form style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Enter new group name"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '16px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              outline: 'none',
              flex: '1 1 200px'
            }}
            required
          />
          <button
            type="submit"
            onClick={handleCreateGroup}
            style={{
              padding: '10px 15px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              flex: '0 0 auto'
            }}
          >
            Create Group
          </button>
        </form>
      </div>

      {/* Users Table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
            <th style={thStyle}>File Code</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>PAN</th>
            <th style={thStyle}>Group</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No data available
              </td>
            </tr>
          ) : (
            filteredUsers.map((user) => (
              <tr key={user.pan} className="group-row">
                <td style={tdStyle}>{user.fileCode}</td>
                <td style={tdStyle}>{user.name}</td>
                <td style={tdStyle}>{user.pan}</td>
                <td style={tdStyle}>
                  <select
                    value={user.group || ''}
                    onChange={(e) => handleGroupChange(user.pan, e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #ccc'
                    }}
                  >
                    <option value="">Select Group</option>
                    {groups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Layout>
  )
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 'bold'
}

const tdStyle: React.CSSProperties = {
  padding: '10px 16px'
}

export default Group
