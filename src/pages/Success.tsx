import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function Success() {
  const { user } = useAuth()
  const [totalCheckins, setTotalCheckins] = useState<number | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      const { count } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setTotalCheckins(count)
    }

    fetchStats()
  }, [user])

  return (
    <div className="page success-page">
      <div className="success-icon">&#10003;</div>
      <h1>Checked In!</h1>
      <p className="success-message">
        You're all set for today's class. Train hard!
      </p>

      {totalCheckins !== null && (
        <div className="stats">
          <p className="stat-number">{totalCheckins}</p>
          <p className="stat-label">Total Classes Attended</p>
        </div>
      )}

      <div className="success-actions">
        <Link to="/history" className="btn btn-secondary">
          View History
        </Link>
        <Link to="/" className="btn btn-outline">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
