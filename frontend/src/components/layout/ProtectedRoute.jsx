import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// A ProtectedRoute komponens egy wrapper, ami ellenőrzi, hogy a felhasználó be van-e jelentkezve.
// Ha nincs bejelentkezve, átirányítja a /login oldalra.
// Ha be van jelentkezve, megjeleníti a children tartalmat.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    // Amíg az AuthContext nem tudja eldönteni, van-e érvényes session,
    // ne irányítsunk át és ne is engedjük be a tartalmat.
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">Betöltés...</span>
      </div>
    )
  }

  if (!user) {
    // Elmentjük, honnan jött a user, hogy bejelentkezés után oda tudjunk
    // majd visszairányítani (opcionális, de kényelmes UX).
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}