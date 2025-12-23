import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Home() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="page home-page">
      <h1>BJJ Attendance Tracker</h1>

      {user ? (
        <div className="user-section">
          <p>Welcome, {user.user_metadata?.full_name || user.email}!</p>
          <button onClick={() => navigate('/checkin')} className="btn btn-primary">
            Scan QR to Check In
          </button>
          <button onClick={() => navigate('/history')} className="btn btn-secondary">
            View Attendance History
          </button>
          <button onClick={handleSignOut} className="btn btn-outline">
            Sign Out
          </button>
        </div>
      ) : (
        <div className="auth-section">
          <p>Scan the gym's QR code to check in for class</p>
          <button onClick={() => navigate('/checkin')} className="btn btn-primary">
            Scan QR Code
          </button>
          <div className="auth-links">
            <p>Already have an account?</p>
            <button onClick={() => navigate('/login')} className="btn btn-secondary">
              Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
