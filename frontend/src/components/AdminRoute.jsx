import { Navigate } from 'react-router-dom'

function AdminRoute({ children }) {
  const token = localStorage.getItem('admin_token')
  if (!token) return <Navigate to="/admin/login" />
  return children
}

export default AdminRoute