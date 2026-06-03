import { useState } from "react"

function Tooltip({
  children,
  text,
  position = "top",
}) {
  const [visible, setVisible] = useState(false)

  const positions = {
    top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left:   "right-full top-1/2 -translate-y-1/2 mr-2",
    right:  "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  const arrows = {
    top:    "top-full left-1/2 -translate-x-1/2 border-t-gray-800",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800",
    left:   "left-full top-1/2 -translate-y-1/2 border-l-gray-800",
    right:  "right-full top-1/2 -translate-y-1/2 border-r-gray-800",
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      {visible && (
        <div className={`absolute z-50 ${positions[position]}`}>
          <div className="bg-gray-800 text-white font-body text-xs
            px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
            {text}
          </div>
        </div>
      )}
    </div>
  )
}

export default Tooltip