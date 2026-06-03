import { Link } from "react-router-dom"

const quickLinks = ["Features", "How it Works", "About", "Contact"]

function Footer() {
  return (
    <footer className="bg-[#0A1931] text-white px-10 py-10">

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4A7FA7] rounded-lg flex items-center
              justify-center font-bold text-white">
              L
            </div>
            <span className="font-semibold text-lg">Learnify</span>
          </div>
          <p className="text-sm text-[#B3CFE5] leading-relaxed">
            Learnify generates personalized study schedules, connects you
            with mentors & peers, and tracks your progress — all in one place.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Quick Links</h4>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link}>
                <Link
                  to="#"
                  className="text-sm text-[#B3CFE5] hover:text-white transition-colors">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Contact Us</h4>
          <ul className="space-y-2 text-sm text-[#B3CFE5]">
            <li>No: 123/6, Ragammawatta, Kirindiwela</li>
            <li>076 555 6756</li>
            <li>learnify@gmail.com</li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#1A3D63]
        text-center text-xs text-[#B3CFE5]">
        © 2026 Learnify. Sabaragamuwa University of Sri Lanka.
      </div>

    </footer>
  )
}

export default Footer