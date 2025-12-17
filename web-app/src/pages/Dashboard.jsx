import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceAPI, leavesAPI } from '../services/api';

function Dashboard() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        onLeaveToday: 0,
        lateToday: 0,
        onTimeToday: 0,
    });
    const [recentLeaves, setRecentLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 30000); // 30s auto-refresh
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            // Parallel fetch
            const [statsRes, leavesRes] = await Promise.all([
                attendanceAPI.getStats(),
                leavesAPI.getAll({ status: 'pending', limit: 3 }), // We filter manually if API limits not supported
            ]);

            if (statsRes.success) {
                setStats(statsRes.data);
            }

            if (leavesRes.success) {
                // Slice top 3 manually just in case
                setRecentLeaves(leavesRes.data.slice(0, 3));
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const calculateDuration = (start, end) => {
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    };

    // Calculate percentages
    const presentPerc = stats.totalEmployees ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0;
    const latePerc = stats.presentToday ? Math.round((stats.lateToday / stats.presentToday) * 100) : 0;
    // For 'not marked', assuming (Total - Present - Leave) = Not Marked/Absent (Approx)
    const notMarkedCount = stats.totalEmployees - stats.presentToday - stats.onLeaveToday;
    const notMarkedPerc = stats.totalEmployees ? Math.round((notMarkedCount / stats.totalEmployees) * 100) : 0;

    return (
        <>
            {/* KPI cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <p className="text-xs text-slate-500 mb-2">Total Employees</p>
                    <p className="text-2xl font-semibold text-slate-800">{stats.totalEmployees}</p>
                    <p className="mt-2 inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                        Active staff
                    </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <p className="text-xs text-slate-500 mb-2">Present Today</p>
                    <p className="text-2xl font-semibold text-emerald-600">{stats.presentToday}</p>
                    <p className="mt-2 text-[11px] text-slate-500">{presentPerc}% of total</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <p className="text-xs text-slate-500 mb-2">Absent Today</p>
                    <p className="text-2xl font-semibold text-rose-600">{stats.absentToday}</p>
                    <p className="mt-2 text-[11px] text-slate-500">Unexplained</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <p className="text-xs text-slate-500 mb-2">On Leave Today</p>
                    <p className="text-2xl font-semibold text-amber-600">{stats.onLeaveToday}</p>
                    <p className="mt-2 text-[11px] text-slate-500">Approved requests</p>
                </div>
            </section>

            {/* Quick actions */}
            <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <p className="text-sm font-semibold text-slate-800">Quick actions</p>
                    <span className="text-[11px] text-slate-500">Frequently used shortcuts</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                    <Link
                        to="/attendance"
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors"
                    >
                        <div>
                            <p className="text-slate-800 font-medium">View attendance</p>
                            <p className="text-slate-500">Monthly & daily summary</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">
                            Open
                        </span>
                    </Link>

                    <Link
                        to="/leave-requests"
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors"
                    >
                        <div>
                            <p className="text-slate-800 font-medium">Review leaves</p>
                            <p className="text-slate-500">Approve / reject requests</p>
                        </div>
                        {recentLeaves.length > 0 && (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                                {recentLeaves.length} Pending
                            </span>
                        )}
                    </Link>

                    <Link
                        to="/holidays"
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors"
                    >
                        <div>
                            <p className="text-slate-800 font-medium">Manage holidays</p>
                            <p className="text-slate-500">Company off days & events</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                            Open
                        </span>
                    </Link>
                </div>
            </section>

            {/* Bottom: left snapshot, right recent leaves */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {/* Left: Today's Attendance Snapshot */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Today's Attendance Snapshot</p>
                            <p className="text-[11px] text-slate-500">Quick view of on-time, late and not-marked employees</p>
                        </div>
                        <span className="text-[11px] text-slate-500">
                            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    </div>

                    <div className="space-y-3 text-xs">
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] text-emerald-800">On time</p>
                                <p className="mt-1 text-lg font-semibold text-emerald-700">{stats.onTimeToday} employees</p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800">
                                {presentPerc > 0 ? Math.round((stats.onTimeToday / stats.presentToday) * 100) : 0}% of present
                            </span>
                        </div>

                        <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] text-amber-800">Late arrivals</p>
                                <p className="mt-1 text-lg font-semibold text-amber-700">{stats.lateToday} employees</p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">
                                {latePerc}% of present
                            </span>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] text-slate-700">Not marked (Absent)</p>
                                <p className="mt-1 text-lg font-semibold text-slate-800">{notMarkedCount} employees</p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] text-slate-700">
                                {notMarkedPerc}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Recent leave requests */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[300px]">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Recent leave requests</p>
                            <p className="text-[11px] text-slate-500">Latest pending requests</p>
                        </div>
                        <Link to="/leave-requests" className="text-[11px] text-blue-600 hover:underline">
                            View all
                        </Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-10 text-slate-400 text-xs">Loading requests...</div>
                    ) : recentLeaves.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs">No pending requests</div>
                    ) : (
                        <ul className="space-y-2 text-[11px]">
                            {recentLeaves.map((leave) => (
                                <li key={leave._id} className="rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors px-3 py-3 flex flex-col gap-2 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {/* Avatar/Photo */}
                                            <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0"> // Added flex-shrink-0
                                                {leave.employee?.profilePhoto ? (
                                                    <img
                                                        src={leave.employee.profilePhoto}
                                                        alt={leave.employee.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-[10px] font-semibold text-slate-600">
                                                        {leave.employee ? getInitials(leave.employee.name) : '??'}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-800">
                                                    {leave.employee?.name || 'Unknown'} · <span className="text-slate-500 font-normal">{leave.type}</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    {formatDate(leave.startDate)} · {calculateDuration(leave.startDate, leave.endDate)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                            Pending
                                        </span>
                                    </div>
                                    <div className="pl-10">
                                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                                            {leave.reason}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Link
                                                to="/leave-requests"
                                                className="text-[10px] font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                Review Request →
                                            </Link>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </>
    );
}

export default Dashboard;
