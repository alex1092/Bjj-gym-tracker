import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Gym {
  id: string
  name: string
}

export function Success() {
  const { gymSlug } = useParams<{ gymSlug: string }>()
  const { user } = useAuth()
  const [totalCheckins, setTotalCheckins] = useState<number | null>(null)
  const [gym, setGym] = useState<Gym | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      // Fetch gym info
      if (gymSlug) {
        const { data: gymData } = await supabase
          .from('gyms')
          .select('id, name')
          .eq('slug', gymSlug)
          .single()

        if (gymData) {
          setGym(gymData)
        }
      }

      // Fetch total checkins
      const { count } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setTotalCheckins(count)
    }

    fetchData()
  }, [user, gymSlug])

  return (
    <div className="page success-page">
      <div className="success-icon">&#10003;</div>
      <h1>Checked In!</h1>
      {gym && <p className="gym-name">{gym.name}</p>}
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
