import { Link } from "react-router-dom"
import learnify_logo from "../../assets/images/learnify_logo.png"

const quickLinks = [
  { label: "Features",      path: "/features"      },
  { label: "How It Works",  path: "/how-it-works"  },
  { label: "About",         path: "/about"         },
  { label: "Contact",       path: "/contact"       },
]

function Footer() {
  return (
    <footer className="bg-[#0A1931] text-white px-10 py-10">

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#f6fafd] rounded-full overflow-hidden flex items-center
              justify-center">
              <img
                src={learnify_logo}
                alt="WhisperHive Logo"
                className="w-full h-full object-cover rounded-full"
                style={{ borderRadius: "50%" }}
              />
            </div>
            <span className="font-semibold text-lg">WhisperHive</span>
          </div>
          <p className="text-sm text-[#B3CFE5] leading-relaxed">
            WhisperHive generates personalized study schedules, connects you
            with mentors & peers, and tracks your progress — all in one place.
          </p>
        </div>

        {/* Quick Links — now with real paths */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Quick Links</h4>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.path}
                  className="text-sm text-[#B3CFE5] hover:text-white
                    transition-colors">
                  {link.label}
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
            <li>
              <a href="mailto:whisperhive@gmail.com"
                className="hover:text-white transition-colors">
                whisperhive.official.edu@gmail.com
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#1A3D63]
        text-center text-xs text-[#B3CFE5]">
        © 2026 WhisperHive. Sabaragamuwa University of Sri Lanka.
      </div>

    </footer>
  )
}

export default Footer