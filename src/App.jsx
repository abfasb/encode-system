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
import PdsPage from './pages/PdsPage'
import Pds2Page from './pages/Pds2Page'
import Pds3Page from './pages/Pds3Page'
import Pds4Page from './pages/Pds4Page'
import PdsCombine from './pages/PdsCombine'
  
function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/excel" element={<ExcelExport />} />
        <Route path="/admin/*" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

        <Route path="/pds" element={<PdsPage />} />
        <Route path="/pds2" element={<Pds2Page />} />
        <Route path="/pds3" element={<Pds3Page />} />
        <Route path="/pds4" element={<Pds4Page />} />
        <Route path="/pds-combine" element={<PdsCombine />} />
      </Routes>
    </Router>
  )
}

export default App
