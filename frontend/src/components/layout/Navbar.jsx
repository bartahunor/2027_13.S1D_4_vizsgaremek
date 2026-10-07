import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleSignOut() {
    const { error } = await signOut()

    if (error) {
      console.error('Hiba kijelentkezéskor:', error.message)
      return
    }

    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">

        {/* LOGÓ */}
        <Link
          to="/"
          className="flex-shrink-0"
          onClick={() => setMobileMenuOpen(false)}
        >
          <img
            src="/logo.png"
            alt="Tudástér logo"
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </Link>

        {/* ASZTALI MENÜ */}
        <div className="hidden md:flex items-center gap-8">

          <Link
            to="/"
            className="text-slate-700 hover:text-primary font-medium transition-colors"
          >
            Tantárgyak
          </Link>

          <Link
            to="/gyakorlas"
            className="text-slate-700 hover:text-primary font-medium transition-colors"
          >
            Gyakorlás
          </Link>

          {loading ? null : user ? (
            <div className="flex items-center gap-4">

              <Link
                to="/profil"
                className="text-slate-700 hover:text-primary font-medium whitespace-nowrap"
              >
                {user.user_metadata?.felhasznalonev ?? user.email}
              </Link>

              <button
                onClick={handleSignOut}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold whitespace-nowrap hover:bg-primary transition-all shadow-md"
              >
                Kijelentkezés
              </button>

            </div>
          ) : (
            <Link
              to="/login"
              className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold whitespace-nowrap hover:bg-primary transition-all shadow-md"
            >
              Belépés
            </Link>
          )}

        </div>

        {/* HAMBURGER */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl text-primary hover:bg-primary/10"
        >
          <span className="material-symbols-outlined">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>

      </div>

      {/* MOBIL MENÜ */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-primary/10 shadow-lg">

          <div className="px-4 py-4 flex flex-col gap-2">

            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-primary/10"
            >
              Tantárgyak
            </Link>

            <Link
              to="/gyakorlas"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-primary/10"
            >
              Gyakorlás
            </Link>

            <div className="h-px bg-primary/10 my-2" />

            {loading ? null : user ? (
              <>
                <Link
                  to="/profil"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-primary/10"
                >
                  {user.user_metadata?.felhasznalonev ?? user.email}
                </Link>

                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-left"
                >
                  Kijelentkezés
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-center"
              >
                Belépés
              </Link>
            )}

          </div>

        </div>
      )}

    </nav>
  )
}