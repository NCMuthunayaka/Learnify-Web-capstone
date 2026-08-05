import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = () => (
  <div className="app-shell flex">
    <Sidebar />
    <div className="flex min-h-screen min-w-0 flex-1 flex-col">
      <Navbar />
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  </div>
);

export default MainLayout;
