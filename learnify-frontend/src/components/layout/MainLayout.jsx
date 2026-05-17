import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  function handleToggleSidebar() {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A1931]">

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Right Side */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Navbar */}
        <Navbar onToggleSidebar={handleToggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0f2744]">
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default MainLayout