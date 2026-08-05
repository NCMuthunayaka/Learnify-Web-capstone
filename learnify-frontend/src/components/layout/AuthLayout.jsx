import { Link } from "react-router-dom"
import authBackground from "../../assets/images/Lock Screen wallpaper.jpg"

function AuthLayout({ children, type = "login" }) {
  const isLogin = type === "login"

  return (
    <div
      className="min-h-screen text-white overflow-hidden relative"
      style={{
        backgroundImage: `url(${authBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_25%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#081122]/80 via-[#081122]/90 to-[#0b1728]/100" />
      <div className="absolute left-1/4 top-[-10%] h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="absolute right-[-10%] bottom-0 h-96 w-96 rounded-full bg-indigo-900/30 blur-3xl" />

      <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
        <div className="hidden md:flex md:w-1/2 items-center justify-center px-16 py-24">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.45em] text-slate-400 mb-4">Learnify</p>
            {isLogin ? (
              <>
                <p className="text-lg text-slate-300 mb-3">Welcome Back To</p>
                <h1 className="text-6xl font-extrabold tracking-tight leading-tight text-white mb-4">Learnify</h1>
                <p className="text-base text-slate-300 max-w-md">
                  Login to continue your learning journey.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-6xl font-extrabold tracking-tight leading-tight text-white mb-4">Learnify</h1>
                <p className="text-3xl font-bold text-slate-100 mb-3">Plan better.</p>
                <p className="text-3xl font-bold text-slate-100 mb-3">Learn smarter.</p>
                <p className="text-3xl font-bold text-slate-100 mb-8">Achieve more.</p>
                <p className="text-base text-slate-300 max-w-lg">
                  Create your Learnify account to access personalized learning schedules, AI-powered assistance, and collaborative learning with mentors and peers.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
            {children}
            <div className="mt-8 text-center text-sm text-slate-300">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <Link to="/register" className="font-semibold text-sky-300 hover:text-white">
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-sky-300 hover:text-white">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
