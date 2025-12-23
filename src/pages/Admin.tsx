import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Gym {
  id: string
  name: string
  slug: string
}

interface AttendanceRecord {
  id: string
  checked_in_at: string
  profiles: {
    full_name: string | null
    email: string
  } | null
}

interface DayStats {
  date: string
  count: number
}

export function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [gyms, setGyms] = useState<Gym[]>([])
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<DayStats[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'today' | 'week' | 'all'>('today')

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnTo=/admin')
      return
    }

    const fetchGyms = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('gyms')
        .select('id, name, slug')
        .eq('owner_id', user.id)

      if (!error && data && data.length > 0) {
        setGyms(data)
        setSelectedGym(data[0])
      }
      setLoading(false)
    }

    if (user) {
      fetchGyms()
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedGym) return

      let query = supabase
        .from('attendance')
        .select('id, checked_in_at, profiles(full_name, email)')
        .eq('gym_id', selectedGym.id)
        .order('checked_in_at', { ascending: false })

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(todayStart)
      weekStart.setDate(weekStart.getDate() - 7)

      if (view === 'today') {
        query = query.gte('checked_in_at', todayStart.toISOString())
      } else if (view === 'week') {
        query = query.gte('checked_in_at', weekStart.toISOString())
      }

      const { data, error } = await query

      if (!error && data) {
        setAttendance(data as unknown as AttendanceRecord[])
      }

      // Get unique members count
      const { count } = await supabase
        .from('attendance')
        .select('user_id', { count: 'exact', head: true })
        .eq('gym_id', selectedGym.id)

      setTotalMembers(count || 0)

      // Get daily stats for the last 7 days
      const dailyStats: DayStats[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(todayStart)
        date.setDate(date.getDate() - i)
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const { count: dayCount } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', selectedGym.id)
          .gte('checked_in_at', date.toISOString())
          .lt('checked_in_at', nextDate.toISOString())

        dailyStats.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          count: dayCount || 0,
        })
      }
      setStats(dailyStats)
    }

    fetchAttendance()
  }, [selectedGym, view])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  if (authLoading || loading) {
    return (
      <div className="page admin-page">
        <h1>Admin Dashboard</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (gyms.length === 0) {
    return (
      <div className="page admin-page">
        <h1>Admin Dashboard</h1>
        <div className="no-gyms">
          <p>You don't own any gyms yet.</p>
          <p>Contact support to set up your gym.</p>
        </div>
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="page admin-page">
      <h1>Admin Dashboard</h1>

      {gyms.length > 1 && (
        <div className="gym-selector">
          <label htmlFor="gym-select">Select Gym:</label>
          <select
            id="gym-select"
            value={selectedGym?.id || ''}
            onChange={(e) => {
              const gym = gyms.find((g) => g.id === e.target.value)
              setSelectedGym(gym || null)
            }}
          >
            {gyms.map((gym) => (
              <option key={gym.id} value={gym.id}>
                {gym.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedGym && (
        <>
          <div className="gym-header">
            <h2>{selectedGym.name}</h2>
            <p className="qr-hint">
              QR Code URL: <code>/checkin/{selectedGym.slug}</code>
            </p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-number">{attendance.length}</p>
              <p className="stat-label">
                {view === 'today' ? "Today's" : view === 'week' ? 'This Week' : 'Total'} Check-ins
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-number">{totalMembers}</p>
              <p className="stat-label">Total Members</p>
            </div>
          </div>

          <div className="chart-section">
            <h3>Last 7 Days</h3>
            <div className="bar-chart">
              {stats.map((day) => (
                <div key={day.date} className="bar-container">
                  <div
                    className="bar"
                    style={{
                      height: `${Math.max(day.count * 20, 4)}px`,
                    }}
                  >
                    {day.count > 0 && <span className="bar-value">{day.count}</span>}
                  </div>
                  <span className="bar-label">{day.date.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${view === 'today' ? 'active' : ''}`}
              onClick={() => setView('today')}
            >
              Today
            </button>
            <button
              className={`toggle-btn ${view === 'week' ? 'active' : ''}`}
              onClick={() => setView('week')}
            >
              This Week
            </button>
            <button
              className={`toggle-btn ${view === 'all' ? 'active' : ''}`}
              onClick={() => setView('all')}
            >
              All Time
            </button>
          </div>

          <div className="attendance-section">
            <h3>Check-ins</h3>
            {attendance.length === 0 ? (
              <p className="no-records">No check-ins for this period.</p>
            ) : (
              <ul className="attendance-list">
                {attendance.map((record) => (
                  <li key={record.id} className="attendance-item admin-item">
                    <div className="member-info">
                      <span className="member-name">
                        {record.profiles?.full_name || 'Unknown'}
                      </span>
                      <span className="member-email">{record.profiles?.email}</span>
                    </div>
                    <div className="checkin-time">
                      <span className="time">{formatTime(record.checked_in_at)}</span>
                      <span className="date">{formatDate(record.checked_in_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <Link to="/" className="back-link">Back to Home</Link>
    </div>
  )
}
