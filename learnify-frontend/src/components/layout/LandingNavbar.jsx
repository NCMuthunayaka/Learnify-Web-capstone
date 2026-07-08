import { Link } from "react-router-dom"
import learnify_logo from "../../assets/images/learnify_logo.png"

function LandingNavbar() {
  return (
    <header className="flex items-center justify-between px-10 py-4
      bg-white shadow-sm border-b border-gray-100">

      {/* Logo — with real image */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#f6fafd] rounded-lg flex items-center
          justify-center">
          <img
            src={learnify_logo}
            alt="Learnify Logo"
            className="w-6 h-6 object-contain"
          />
        </div>
        <span className="font-semibold text-lg text-[#1A3D63]">Learnify</span>
      </Link>

      {/* Nav Links */}
      <nav className="hidden md:flex items-center gap-8">
        <Link to="/"
          className="text-sm text-gray-600 hover:text-[#1A3D63] transition-colors">
          Home
        </Link>
        <Link to="/features"
          className="text-sm text-gray-600 hover:text-[#1A3D63] transition-colors">
          Features
        </Link>
        <Link to="/how-it-works"
          className="text-sm text-gray-600 hover:text-[#1A3D63] transition-colors">
          How It Works
        </Link>
        <Link to="/about"
          className="text-sm text-gray-600 hover:text-[#1A3D63] transition-colors">
          About
        </Link>
        <Link to="/contact"
          className="text-sm text-gray-600 hover:text-[#1A3D63] transition-colors">
          Contact
        </Link>
      </nav>

      {/* Auth Buttons */}
      <div className="flex items-center gap-3">
        <Link to="/register"
          className="text-sm font-medium text-[#1A3D63]
            hover:text-[#4A7FA7] transition-colors">
          Register
        </Link>
        <Link to="/login"
          className="text-sm font-medium bg-[#1A3D63] text-white
            px-5 py-2 rounded-lg hover:bg-[#4A7FA7] transition-colors duration-200">
          Login
        </Link>
      </div>

    </header>
  )
}

export default LandingNavbar