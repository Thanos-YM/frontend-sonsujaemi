import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Calendar, Map, BookOpen, LogOut } from 'lucide-react'
import useAuthStore from '../stores/useAuthStore'

const navItems = [
  { to: '/availability', label: '일정 조율', icon: Calendar },
  { to: '/trips', label: '여행', icon: Map },
  { to: '/archive', label: '기록', icon: BookOpen },
]

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-fluid-sm font-medium transition-colors ${
      isActive ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-500'
    }`

  const mobileNavClass = ({ isActive }) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl text-fluid-xs font-medium transition-colors min-h-[3rem] min-w-0 ${
      isActive ? 'text-[#7466C5] bg-[#A299D8]/12' : 'text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm pt-safe">
        <div className="max-w-fluid-page mx-auto px-fluid-sm md:px-fluid-md h-14 flex items-center justify-between gap-3">
          <span className="md:hidden font-semibold text-gray-900 tracking-tight shrink-0">
            손수재미
          </span>
          <nav className="hidden md:flex gap-1" aria-label="주요 메뉴">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="relative shrink-0" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-fluid-xs sm:px-fluid-sm py-1.5 rounded-lg hover:bg-gray-100 transition-colors max-w-[min(100%,12rem)]"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-fluid-xs font-bold"
                style={{ backgroundColor: user?.color || '#6366f1' }}
              >
                {user?.name?.charAt(0)}
              </div>
              <span className="hidden sm:inline text-fluid-sm font-medium text-gray-700 truncate">
                {user?.name}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-fluid-xs text-gray-500">
                    {user?.role === 'ADMIN' ? '관리자' : '멤버'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-fluid-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-fluid-page mx-auto px-fluid-sm md:px-fluid-md py-fluid-md md:py-fluid-lg pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-6">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-200 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
        aria-label="주요 메뉴"
      >
        <div className="max-w-fluid-page mx-auto flex items-stretch justify-around px-fluid-xs">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={mobileNavClass}>
              <Icon size={20} strokeWidth={2} className="shrink-0" />
              <span className="truncate max-w-full">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
