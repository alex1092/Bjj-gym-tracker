import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { QRScanner } from '../components/QRScanner'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function CheckIn() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)

  const handleScan = async (data: string) => {
    setScanning(false)

    // Validate QR code (you can customize this validation)
    if (!data.includes('bjj-checkin')) {
      setError('Invalid QR code. Please scan the gym\'s check-in QR code.')
      setScanning(true)
      return
    }

    if (!user) {
      // Not logged in, redirect to signup
      navigate('/signup', { state: { returnTo: '/checkin' } })
      return
    }

    // User is logged in, record attendance
    const { error: insertError } = await supabase.from('attendance').insert({
      user_id: user.id,
    })

    if (insertError) {
      setError('Failed to check in. Please try again.')
      setScanning(true)
    } else {
      navigate('/success')
    }
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <div className="page checkin-page">
      <h1>Check In</h1>

      {error && <div className="error-message">{error}</div>}

      {scanning && (
        <>
          <p>Scan the gym's QR code to check in</p>
          <QRScanner onScan={handleScan} onError={handleError} />
        </>
      )}

      <Link to="/" className="back-link">Back to Home</Link>
    </div>
  )
}
