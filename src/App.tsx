import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { CheckIn } from './pages/CheckIn'
import { Success } from './pages/Success'
import { History } from './pages/History'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/success" element={<Success />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
