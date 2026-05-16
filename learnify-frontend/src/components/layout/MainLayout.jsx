import { useState } from "react"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A1931]">

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Right Side */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Dashboard Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0f2744]">
          {children}
        </main>

      </div>
    </div>
  )
}

export default MainLayout