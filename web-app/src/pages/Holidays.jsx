import { useState, useEffect } from 'react';
import { holidaysAPI } from '../services/api';

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function Holidays() {
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
    const [month, setMonth] = useState(currentDate.getMonth());
    const [year, setYear] = useState(currentDate.getFullYear());
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        type: 'national',
        description: '',
    });

    // Load holidays on mount and when year changes
    useEffect(() => {
        loadHolidays();
    }, [selectedYear]);

    const loadHolidays = async () => {
        setLoading(true);
        try {
            const result = await holidaysAPI.getAll({ year: selectedYear });
            console.log('📅 Holidays loaded:', result);
            if (result.success) {
                setHolidays(result.data || []);
            }
        } catch (error) {
            console.error('Load holidays error:', error);
        } finally {
            setLoading(false);
        }
    };

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

    // Get holidays for current month
    const monthHolidays = holidays.filter((h) => {
        const d = new Date(h.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    // Get holiday dates for calendar highlighting
    const holidayDates = holidays.reduce((acc, h) => {
        const dateKey = new Date(h.date).toISOString().split('T')[0];
        acc[dateKey] = h.type;
        return acc;
    }, {});

    // Render calendar grid
    const renderCalendar = () => {
        const first = new Date(year, month, 1);
        const startDay = first.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];

        // Empty cells for alignment
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} className="h-8" />);
        }

        // Day cells
        for (let d = 1; d <= daysInMonth; d++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const holidayType = holidayDates[dateKey];

            let bgClass = '';
            if (holidayType === 'national') {
                bgClass = 'rounded-full bg-emerald-600 text-white font-medium';
            } else if (holidayType === 'company') {
                bgClass = 'rounded-full bg-sky-500 text-white font-medium';
            } else if (holidayType === 'optional') {
                bgClass = 'rounded-full bg-amber-500 text-white font-medium';
            }

            cells.push(
                <div
                    key={d}
                    className={`h-8 flex items-center justify-center text-slate-500 ${bgClass}`}
                >
                    {d}
                </div>
            );
        }

        return cells;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.date) return;

        setSaving(true);
        try {
            const result = await holidaysAPI.create({
                name: formData.name,
                date: formData.date,
                type: formData.type,
                description: formData.description,
            });

            console.log('📅 Holiday created:', result);

            if (result.success) {
                setHolidays([...holidays, result.data]);
                setFormData({ name: '', date: '', type: 'national', description: '' });
            } else {
                alert('Failed to create holiday: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Create holiday error:', error);
            alert('Failed to create holiday');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this holiday?')) return;

        try {
            const result = await holidaysAPI.delete(id);
            console.log('📅 Holiday deleted:', result);

            if (result.success) {
                setHolidays(holidays.filter(h => h._id !== id));
            } else {
                alert('Failed to delete holiday');
            }
        } catch (error) {
            console.error('Delete holiday error:', error);
            alert('Failed to delete holiday');
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'national': return 'National';
            case 'company': return 'Company';
            case 'optional': return 'Optional';
            default: return type;
        }
    };

    const getTypeBadgeClass = (type) => {
        switch (type) {
            case 'national': return 'bg-emerald-50 text-emerald-700';
            case 'company': return 'bg-sky-50 text-sky-700';
            case 'optional': return 'bg-amber-50 text-amber-700';
            default: return 'bg-slate-50 text-slate-700';
        }
    };

    return (
        <>
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-sm sm:text-base font-semibold text-slate-800">
                        Holidays & Off Days
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                        Manage official holidays and company off days for the year
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                    <select
                        value={selectedYear}
                        onChange={(e) => {
                            setSelectedYear(e.target.value);
                            setYear(parseInt(e.target.value));
                        }}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                    {loading && (
                        <span className="text-sky-600">Loading...</span>
                    )}
                </div>
            </div>

            {/* Two-column layout */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
                {/* Left: Calendar + holiday list */}
                <div className="xl:col-span-2 space-y-4">
                    {/* Calendar */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60">
                        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Holiday calendar</p>
                                <p className="text-[11px] text-slate-500">
                                    Highlighted days will appear as "Holiday" in attendance calendars
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                                <button
                                    onClick={() => changeMonth(-1)}
                                    className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-50"
                                >
                                    ◀
                                </button>
                                <span className="font-medium text-slate-700">
                                    {monthNames[month]} {year}
                                </span>
                                <button
                                    onClick={() => changeMonth(1)}
                                    className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-50"
                                >
                                    ▶
                                </button>
                            </div>
                        </div>

                        {/* Calendar grid */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-[11px]">
                            <div className="grid grid-cols-7 gap-1 text-center text-slate-400 mb-1">
                                <div>Sun</div>
                                <div>Mon</div>
                                <div>Tue</div>
                                <div>Wed</div>
                                <div>Thu</div>
                                <div>Fri</div>
                                <div>Sat</div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {renderCalendar()}
                            </div>

                            {/* Legend */}
                            <div className="mt-3 flex items-center gap-4 text-[11px]">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
                                    <span className="text-slate-600">National</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-sky-500 inline-block" />
                                    <span className="text-slate-600">Company</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                                    <span className="text-slate-600">Optional</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Month holiday list */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                            <p className="text-sm font-semibold text-slate-800">
                                Holidays in {monthNames[month]} {year}
                            </p>
                            <span className="text-[11px] text-slate-500">
                                {monthHolidays.length} holiday(s)
                            </span>
                        </div>

                        <ul className="space-y-2 text-[11px]">
                            {monthHolidays.length === 0 ? (
                                <li className="text-slate-500 py-2">No holidays this month</li>
                            ) : (
                                monthHolidays.map((h) => (
                                    <li
                                        key={h._id}
                                        className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                                    >
                                        <div>
                                            <p className="text-slate-800 font-medium">{h.name}</p>
                                            <p className="text-slate-500">
                                                {formatDate(h.date)} · Full day · {h.description || '-'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${getTypeBadgeClass(h.type)}`}>
                                                {getTypeLabel(h.type)}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(h._id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>

                {/* Right: Add holiday form */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60">
                    <div className="mb-4">
                        <p className="text-sm font-semibold text-slate-800">Add Holiday</p>
                        <p className="text-[11px] text-slate-500">
                            Add new holiday - will sync to employee app automatically
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
                        <div className="flex flex-col">
                            <label className="mb-1 font-medium text-slate-600">Holiday name</label>
                            <input
                                type="text"
                                placeholder="e.g. Diwali, Independence Day"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 font-medium text-slate-600">Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 font-medium text-slate-600">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                            >
                                <option value="national">National Holiday</option>
                                <option value="company">Company Off</option>
                                <option value="optional">Optional Holiday</option>
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 font-medium text-slate-600">Description</label>
                            <textarea
                                rows="3"
                                placeholder="Short description visible to employees..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full inline-flex items-center justify-center rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-[11px] font-medium text-white shadow-sm shadow-emerald-500/40 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Add Holiday'}
                        </button>

                        <p className="mt-2 text-[10px] text-slate-400">
                            Saved holidays will automatically appear in employee app's Holidays tab.
                        </p>
                    </form>
                </div>
            </section>
        </>
    );
}

export default Holidays;
