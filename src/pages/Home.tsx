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
          <p className="instruction">Scan your gym's QR code with your phone camera to check in</p>
          <button onClick={() => navigate('/history')} className="btn btn-primary">
            View Attendance History
          </button>
          <button onClick={handleSignOut} className="btn btn-outline">
            Sign Out
          </button>
        </div>
      ) : (
        <div className="auth-section">
          <p>Scan your gym's QR code with your phone camera to check in for class</p>
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
