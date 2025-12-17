import { NavLink } from 'react-router-dom';

const navItems = [
    { to: '/', icon: 'fa-solid fa-gauge', label: 'Dashboard' },
    { to: '/attendance', icon: 'fa-regular fa-calendar-check', label: 'Attendance' },
    { to: '/leave-requests', icon: 'fa-regular fa-paper-plane', label: 'Leave Requests' },
    { to: '/holidays', icon: 'fa-regular fa-calendar-days', label: 'Holidays' },
    { to: '/employees', icon: 'fa-solid fa-users', label: 'Employees' },
    { to: '/settings', icon: 'fa-solid fa-gear', label: 'Settings' },
];

function Sidebar({ isMobileOpen, onClose }) {
    const NavItem = ({ to, icon, label }) => (
        <NavLink
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
                `flex items-center px-3 py-2 font-medium rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-slate-50 shadow-sm shadow-blue-900/30'
                    : 'text-slate-200 hover:bg-white/5 hover:text-white'
                }`
            }
        >
            <span
                className={`mr-3 inline-flex h-7 w-7 items-center justify-center rounded-md text-[13px] ${'bg-[#112347]'
                    }`}
            >
                <i className={icon}></i>
            </span>
            {label}
        </NavLink>
    );

    const SidebarContent = () => (
        <>
            {/* Brand */}
            <div className="h-16 flex items-center px-5 border-b border-[#102B5F]">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#1C4BA0] to-[#0B2854] flex items-center justify-center shadow-lg shadow-blue-900/40">
                    <span className="text-xl font-extrabold text-sky-100">P</span>
                </div>
                <div className="ml-3">
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-sky-100">
                        Pasiware
                    </p>
                    <p className="text-[11px] text-sky-300/80">
                        Technologies Private Ltd.
                    </p>
                </div>
                {isMobileOpen && (
                    <button
                        onClick={onClose}
                        className="ml-auto text-slate-300 hover:text-white text-xl md:hidden"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 mt-4 space-y-1 px-3 pb-4 overflow-y-auto text-[13px]">
                {navItems.map((item) => (
                    <NavItem key={item.to} {...item} />
                ))}
            </nav>

            <div className="border-t border-[#102B5F] p-3 text-[11px] text-sky-200/70">
                &copy; 2025 Pasiware Attendance
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-[#0B2854] text-slate-100 flex-col fixed inset-y-0 left-0 z-30">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <div
                className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            >
                <div
                    className={`w-64 bg-[#0B2854] text-slate-100 flex flex-col h-full transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <SidebarContent />
                </div>
            </div>
        </>
    );
}

export default Sidebar;
