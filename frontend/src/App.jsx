import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import CustomerDashboard from './pages/CustomerDashboard'
import HelperDashboard from './pages/HelperDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import PaymentHistory from './pages/PaymentHistory'
import NotFound from './pages/NotFound'
import ServerError from './pages/ServerError'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminRoute from './components/AdminRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/customer" element={
          <ProtectedRoute role="customer">
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/helper" element={
          <ProtectedRoute role="helper">
            <HelperDashboard />
          </ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute role="customer">
            <PaymentHistory />
          </ProtectedRoute>
        } />
        <Route path="/500" element={<ServerError />} />
        <Route path="*" element={<NotFound />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
      </Routes>
      
    </BrowserRouter>
  )
}

export default App