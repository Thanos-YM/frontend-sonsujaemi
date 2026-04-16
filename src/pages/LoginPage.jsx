import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import useAuthStore from '../stores/useAuthStore'

export default function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(loginId, password)
      navigate('/availability')
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#FDFBFA] to-[#F4928A]/6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 bg-white/70 shadow-sm border border-[#F4928A]/15">
            <img
              src="/ssjm-icon.svg"
              alt="손수재미"
              className="w-14 h-14 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">손수재미</h1>
          <p className="text-sm text-gray-500 mt-1">일정관리</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4928A]/40 focus:border-[#F4928A] outline-none transition-shadow text-sm"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4928A]/40 focus:border-[#F4928A] outline-none transition-shadow text-sm"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#F4928A] text-white py-2.5 rounded-lg font-medium hover:brightness-95 disabled:opacity-50 transition-colors text-sm"
          >
            <LogIn size={16} />
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
