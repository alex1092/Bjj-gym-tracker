import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface AttendanceRecord {
  id: string
  checked_in_at: string
}

export function History() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
      return
    }

    const fetchRecords = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('attendance')
        .select('id, checked_in_at')
        .eq('user_id', user.id)
        .order('checked_in_at', { ascending: false })

      if (!error && data) {
        setRecords(data)
      }
      setLoadingRecords(false)
    }

    if (user) {
      fetchRecords()
    }
  }, [user, loading, navigate])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading || loadingRecords) {
    return (
      <div className="page history-page">
        <h1>Attendance History</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="page history-page">
      <h1>Attendance History</h1>

      {records.length === 0 ? (
        <p className="no-records">No check-ins yet. Scan the QR code to record your first class!</p>
      ) : (
        <>
          <p className="total-count">{records.length} total classes</p>
          <ul className="attendance-list">
            {records.map((record) => (
              <li key={record.id} className="attendance-item">
                {formatDate(record.checked_in_at)}
              </li>
            ))}
          </ul>
        </>
      )}

      <Link to="/" className="back-link">Back to Home</Link>
    </div>
  )
}
