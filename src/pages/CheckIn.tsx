import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Gym {
  id: string
  name: string
  slug: string
}

export function CheckIn() {
  const { gymSlug } = useParams<{ gymSlug: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [gym, setGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)

  useEffect(() => {
    const fetchGym = async () => {
      if (!gymSlug) {
        setError('Invalid check-in link. No gym specified.')
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('gyms')
        .select('id, name, slug')
        .eq('slug', gymSlug)
        .single()

      if (fetchError || !data) {
        setError('Gym not found. Please check the QR code.')
        setLoading(false)
        return
      }

      setGym(data)
      setLoading(false)
    }

    fetchGym()
  }, [gymSlug])

  useEffect(() => {
    if (!authLoading && !user && gym) {
      // Not logged in, redirect to signup with return URL
      navigate(`/signup?returnTo=/checkin/${gymSlug}`)
    }
  }, [authLoading, user, gym, gymSlug, navigate])

  const handleCheckIn = async () => {
    if (!user || !gym) return

    setCheckingIn(true)
    setError('')

    const { error: insertError } = await supabase.from('attendance').insert({
      user_id: user.id,
      gym_id: gym.id,
    })

    if (insertError) {
      setError('Failed to check in. Please try again.')
      setCheckingIn(false)
    } else {
      navigate(`/success/${gymSlug}`)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="page checkin-page">
        <h1>Loading...</h1>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page checkin-page">
        <h1>Check In</h1>
        <div className="error-message">{error}</div>
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page checkin-page">
        <h1>Redirecting to sign up...</h1>
      </div>
    )
  }

  return (
    <div className="page checkin-page">
      <h1>Check In</h1>

      {gym && (
        <div className="gym-info">
          <h2>{gym.name}</h2>
          <p>Ready to check in for today's class?</p>
        </div>
      )}

      <button
        onClick={handleCheckIn}
        className="btn btn-primary"
        disabled={checkingIn}
      >
        {checkingIn ? 'Checking in...' : 'Confirm Check In'}
      </button>

      <Link to="/" className="back-link">Cancel</Link>
    </div>
  )
}
