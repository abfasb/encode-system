import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import ProtectedRoute from './pages/ProtectedRoute'
import ExcelExport from './components/admin/ExcelExport'
  
function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/excel" element={<ExcelExport />} />
        <Route path="/admin/*" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

export default App
