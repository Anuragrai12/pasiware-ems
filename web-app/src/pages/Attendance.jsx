import { useState, useEffect } from 'react';
import { attendanceAPI, employeesAPI } from '../services/api';

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function AttendanceCalendarModal({ employeeKey, isOpen, onClose }) {
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(false);
    const [employeeDetails, setEmployeeDetails] = useState(null);

    // Fetch daily attendance when month/year changes or modal opens
    useEffect(() => {
        if (isOpen && employeeKey) {
            fetchEmployeeAttendance();
        }
    }, [isOpen, employeeKey, month, year]);

    const fetchEmployeeAttendance = async () => {
        setLoading(true);
        try {
            // Fetch attendance for this employee & month
            // We need employee ID. employeeKey passed from parent is the _id
            const res = await attendanceAPI.getByEmployee(employeeKey, { month: month + 1, year }); // API expects 1-based month

            if (res.success) {
                // Transform array to date map: '2025-12-01': 'P'
                const map = {};
                res.data.forEach(record => {
                    const d = new Date(record.date).toISOString().split('T')[0];
                    let statusChar = 'P';
                    if (record.status === 'absent') statusChar = 'A';
                    if (record.status === 'leave') statusChar = 'L';
                    if (record.status === 'halfday') statusChar = 'H';
                    if (record.status === 'late') statusChar = 'La';
                    map[d] = statusChar;
                });
                setAttendanceData(map);

                // If we have data, we can get name/dept from first record, OR we should fetch employee details separately
                // Ideally parent passes full employee object, but to be safe we can use what we have
                if (res.data.length > 0) {
                    setEmployeeDetails(res.data[0].employee); // Populate if available in attendance record
                }
            }
        } catch (error) {
            console.error('Error fetching calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const changeMonth = (delta) => {
        let newMonth = month + delta;
        let newYear = year;
        if (newMonth < 0) {
            newMonth = 11;
            newYear -= 1;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear += 1;
        }
        setMonth(newMonth);
        setYear(newYear);
    };

    const renderGrid = () => {
        const first = new Date(year, month, 1);
        const startDay = first.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];

        // Empty cells
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} className="h-7" />);
        }

        // Day cells
        for (let d = 1; d <= daysInMonth; d++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const status = attendanceData[dateKey];
            const dow = new Date(year, month, d).getDay();

            let bg = 'bg-white';
            let dot = null;

            if (status === 'P') {
                bg = 'bg-emerald-50';
                dot = <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block mr-1" />;
            } else if (status === 'La') {
                bg = 'bg-amber-50';
                dot = <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block mr-1" />;
            } else if (status === 'A') {
                bg = 'bg-red-50';
                dot = <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block mr-1" />;
            } else if (status === 'L') {
                bg = 'bg-violet-50';
                dot = <span className="h-1.5 w-1.5 rounded-full bg-violet-500 inline-block mr-1" />;
            } else if (dow === 0) { // Sunday
                bg = 'bg-slate-100';
                dot = <span className="h-1.5 w-1.5 rounded-full bg-slate-400 inline-block mr-1" />;
            }

            cells.push(
                <div
                    key={d}
                    className={`h-7 flex items-center justify-center text-[10px] text-slate-700 rounded-full ${bg}`}
                >
                    {dot}
                    {d}
                </div>
            );
        }

        return cells;
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center px-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-4 space-y-3"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Attendance Calendar</p>
                        <p className="text-[11px] text-slate-500">{monthNames[month]} {year}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[11px] text-slate-600 hover:bg-slate-200"
                        >
                            ◀
                        </button>
                        <button
                            onClick={() => changeMonth(1)}
                            className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[11px] text-slate-600 hover:bg-slate-200"
                        >
                            ▶
                        </button>
                        <button
                            onClick={onClose}
                            className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs hover:bg-slate-200"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2">
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 mb-1">
                        <div>Su</div>
                        <div>Mo</div>
                        <div>Tu</div>
                        <div>We</div>
                        <div>Th</div>
                        <div>Fr</div>
                        <div>Sa</div>
                    </div>
                    {loading ? (
                        <div className="py-10 text-center text-xs text-slate-400">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                            {renderGrid()}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
                    <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        Present
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                        Late
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                        Absent
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
                        Leave
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
                        Sunday
                    </span>
                </div>
            </div>
        </div>
    );
}

function Attendance() {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        department: 'all',
        status: 'all',
    });

    useEffect(() => {
        loadAttendanceData();
        const interval = setInterval(loadAttendanceData, 30000); // 30s auto-refresh
        return () => clearInterval(interval);
    }, [filters]); // Refetch when filters change

    const loadAttendanceData = async () => {
        setLoading(true);
        try {
            const res = await attendanceAPI.getMonthlySummary({
                month: filters.month,
                year: filters.year,
            });

            if (res.success) {
                setAttendanceData(res.data);
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = attendanceData.filter((record) => {
        const empName = record.employee?.name?.toLowerCase() || '';
        const empId = record.employee?.empId?.toLowerCase() || '';
        const matchesSearch = empName.includes(searchQuery.toLowerCase()) || empId.includes(searchQuery.toLowerCase());

        const matchesDept = filters.department === 'all' || (record.employee?.department?.toLowerCase() === filters.department?.toLowerCase());

        const matchesStatus = filters.status === 'all' ||
            (filters.status === 'good' && record.percentage >= 90) ||
            (filters.status === 'poor' && record.percentage < 70); // Adjusted poor threshold

        return matchesSearch && matchesDept && matchesStatus;
    });

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

    return (
        <>
            {/* Title row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-sm sm:text-base font-semibold text-slate-800">
                        Attendance Overview
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                        Track daily attendance by employee and month
                    </p>
                </div>
                <button
                    onClick={() => loadAttendanceData()}
                    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[11px] sm:text-xs text-slate-600 hover:bg-slate-50"
                >
                    ↻ Refresh
                </button>
            </div>

            {/* Filters */}
            <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex flex-col">
                        <label className="text-[11px] font-medium text-slate-500 mb-1">Month</label>
                        <select
                            value={filters.month}
                            onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                        >
                            <option value="12">December</option>
                            <option value="11">November</option>
                            <option value="10">October</option>
                            <option value="1">January</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[11px] font-medium text-slate-500 mb-1">Department</label>
                        <select
                            value={filters.department}
                            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                        >
                            <option value="all">All Departments</option>
                            <option value="Development">Development</option>
                            <option value="HR">HR</option>
                            <option value="Support">Support</option>
                            <option value="Marketing">Marketing</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[11px] font-medium text-slate-500 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                        >
                            <option value="all">All</option>
                            <option value="good">Present &gt; 90%</option>
                            <option value="poor">Frequent Absent</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[11px] font-medium text-slate-500 mb-1">Search employee</label>
                        <input
                            type="text"
                            placeholder="Name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                        />
                    </div>
                </div>
            </section>



            {/* Attendance table */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/60">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Employee Monthly Attendance</p>
                        <p className="text-[11px] text-slate-500">
                            Summary for selected month (P = Present, A = Absent, L = Leave)
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">P</span>
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">La</span>
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-red-700">A</span>
                        <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-violet-700">L</span>
                    </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                    <div className="max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                            <thead className="bg-slate-50/80 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-slate-500 bg-slate-50/90">Employee</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-500 bg-slate-50/90">Emp ID</th>
                                    <th className="px-4 py-2 text-center font-medium text-slate-500 bg-slate-50/90">Present</th>
                                    <th className="px-4 py-2 text-center font-medium text-slate-500 bg-slate-50/90">Absent</th>
                                    <th className="px-4 py-2 text-center font-medium text-slate-500 bg-slate-50/90">Leave</th>
                                    <th className="px-4 py-2 text-center font-medium text-slate-500 bg-slate-50/90">% Presence</th>
                                    <th className="px-4 py-2 text-right font-medium text-slate-500 bg-slate-50/90">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading && attendanceData.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-4 text-slate-400">Loading data...</td></tr>
                                ) : filteredEmployees.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-4 text-slate-400">No employees found</td></tr>
                                ) : (
                                    filteredEmployees.map((record) => (
                                        <tr key={record.employee._id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center bg-slate-200">
                                                        {record.employee.profilePhoto ? (
                                                            <img
                                                                src={record.employee.profilePhoto}
                                                                alt={record.employee.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="text-[10px] font-semibold text-slate-700">
                                                                {getInitials(record.employee.name)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{record.employee.name}</p>
                                                        <p className="text-[11px] text-slate-500">{record.employee.department}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-slate-600">{record.employee.empId}</td>
                                            <td className="px-4 py-2 text-center text-emerald-700">{record.present}</td>
                                            <td className="px-4 py-2 text-center text-red-600">{record.absent}</td>
                                            <td className="px-4 py-2 text-center text-violet-600">{record.leave}</td>
                                            <td className={`px-4 py-2 text-center font-semibold ${record.percentage >= 90 ? 'text-emerald-700' : 'text-slate-600'}`}>
                                                {record.percentage}%
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <button
                                                    onClick={() => setSelectedEmployeeId(record.employee._id)}
                                                    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                                                >
                                                    View calendar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden px-4 py-3 space-y-2">
                    {loading && attendanceData.length === 0 && <div className="text-center text-slate-400">Loading...</div>}
                    <div className="space-y-2">
                        {filteredEmployees.map((record) => (
                            <div
                                key={record.employee._id}
                                className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs flex flex-col gap-1"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                                            {record.employee.profilePhoto ? (
                                                <img
                                                    src={record.employee.profilePhoto}
                                                    alt={record.employee.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-[10px] font-semibold text-slate-700">
                                                    {getInitials(record.employee.name)}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{record.employee.name}</p>
                                            <p className="text-[11px] text-slate-500">
                                                {record.employee.empId} · {record.employee.department}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${record.percentage >= 90
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-amber-50 text-amber-700'
                                            }`}
                                    >
                                        {record.percentage}% P
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] pl-10">
                                    <span className="text-emerald-700">P: {record.present}</span>
                                    <span className="text-red-700">A: {record.absent}</span>
                                    <span className="text-violet-700">L: {record.leave}</span>
                                </div>
                                <button
                                    onClick={() => setSelectedEmployeeId(record.employee._id)}
                                    className="mt-2 inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                                >
                                    View calendar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Calendar Modal */}
            <AttendanceCalendarModal
                employeeKey={selectedEmployeeId}
                isOpen={!!selectedEmployeeId}
                onClose={() => setSelectedEmployeeId(null)}
            />
        </>
    );
}

export default Attendance;
