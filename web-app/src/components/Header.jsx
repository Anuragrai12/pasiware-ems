import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header({ onMenuClick, title, subtitle }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const { admin, logout } = useAuth();
    const navigate = useNavigate();

    const today = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Get initials from admin name
    const getInitials = () => {
        if (admin?.name) {
            return admin.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'AD';
    };

    return (
        <header className="h-16 bg-gradient-to-r from-white via-slate-50 to-white/90 backdrop-blur border-b border-slate-200/70 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
            <div className="flex items-center space-x-3">
                {/* Mobile menu button */}
                <button
                    className="md:hidden inline-flex items-center justify-center rounded-md border border-slate-200 h-9 w-9 text-slate-600 hover:bg-slate-50"
                    onClick={onMenuClick}
                >
                    <span className="sr-only">Open sidebar</span>
                    <div className="space-y-1">
                        <span className="block h-0.5 w-4 bg-slate-600"></span>
                        <span className="block h-0.5 w-4 bg-slate-600"></span>
                        <span className="block h-0.5 w-4 bg-slate-600"></span>
                    </div>
                </button>

                <div>
                    <h1 className="text-base sm:text-lg font-semibold text-[#0B2854] tracking-wide">
                        {title || 'Pasiware Attendance'}
                    </h1>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                        {subtitle || 'Admin control · Dashboard overview'}
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="hidden md:flex items-center bg-slate-100 rounded-full px-3 py-1 text-xs text-slate-500">
                    <span className="mr-2 h-2 w-2 rounded-full bg-emerald-400"></span>
                    Today: {today}
                </div>

                <button className="hidden sm:inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">
                    <span className="mr-1 h-2 w-2 rounded-full bg-sky-500"></span>
                    This Month
                </button>

                {/* Profile + logout dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center rounded-full bg-[#0B2854] text-sky-50 px-2 py-1 text-xs shadow-sm shadow-blue-900/40"
                    >
                        <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] text-[11px] font-semibold">
                            {getInitials()}
                        </span>
                        <span className="hidden sm:inline">{admin?.name || 'Admin'}</span>
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-xl shadow-lg shadow-slate-200/60 text-[11px] py-1 z-30">
                            <div className="px-3 py-2 border-b border-slate-100">
                                <p className="font-medium text-slate-800">{admin?.name}</p>
                                <p className="text-slate-500 text-[10px]">{admin?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
