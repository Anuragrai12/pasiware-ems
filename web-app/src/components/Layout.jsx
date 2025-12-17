import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
    '/': { title: 'Pasiware Attendance', subtitle: 'Admin control · Dashboard overview' },
    '/attendance': { title: 'Pasiware Attendance', subtitle: 'Admin control · Attendance overview' },
    '/leave-requests': { title: 'Pasiware Attendance', subtitle: 'Admin control · Leave requests' },
    '/holidays': { title: 'Pasiware Attendance', subtitle: 'Admin control · Holidays' },
    '/employees': { title: 'Pasiware Attendance', subtitle: 'Admin control · Employees' },
    '/settings': { title: 'Pasiware Attendance', subtitle: 'Admin control · Settings' },
};

function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setMounted(true);
    }, []);

    const { title, subtitle } = pageTitles[location.pathname] || pageTitles['/'];

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar isMobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div
                className={`flex-1 flex flex-col md:ml-64 transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}
            >
                <Header
                    onMenuClick={() => setSidebarOpen(true)}
                    title={title}
                    subtitle={subtitle}
                />
                <main className="flex-1 p-4 space-y-4 bg-slate-100/50">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;
