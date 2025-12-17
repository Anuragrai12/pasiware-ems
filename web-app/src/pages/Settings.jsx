import { useState, useEffect } from 'react';
import { settingsAPI, authAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const sections = ['Organization', 'Attendance rules', 'Leave types', 'Salary & Payroll', 'Admin account'];

function Settings() {
    const [activeSection, setActiveSection] = useState('Organization');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Backend uses ['Mon', 'Tue', ...]
    const [workDays, setWorkDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

    const [orgSettings, setOrgSettings] = useState({
        companyName: '',
        shortName: '',
        timeZone: 'Asia/Kolkata',
    });

    const [attendanceRules, setAttendanceRules] = useState({
        startTime: '09:30',
        endTime: '18:30',
        lateGrace: 15,
        halfDayAfter: '12:00',
        absentBy: '14:00',
        autoApprove: false,
        officeIP: '',
    });

    const [leaveSettings, setLeaveSettings] = useState({
        monthlyCasualLimit: 1,
        maxLeavesPerMonth: 2,
        minNoticeDays: 0,
    });

    const [salarySettings, setSalarySettings] = useState({
        currency: '₹',
        paymentDate: 1,
        periodStartDate: 1,
        basicPercent: 40,
        hraPercent: 50,
        conveyance: 0,
        medical: 0,
        overtimeEnabled: false,
        overtimeRate: 1.5,
        lopEnabled: true,
        pfPercent: 12,
        esiPercent: 0.75,
        professionalTax: 0,
        tdsPercent: 0,
        allowAdvance: false,
        maxAdvancePercent: 50,
        advanceMonths: 3,
        performanceBonusEnabled: false,
        festivalBonus: 0,
        attendanceBonus: 0,
    });

    const [adminSettings, setAdminSettings] = useState({
        email: '',
        phone: '',
        newPassword: '',
        confirmPassword: '',
        notifyLeave: false,
        notifyAttendance: false,
    });

    const days = [
        { label: 'S', value: 'Sun' },
        { label: 'M', value: 'Mon' },
        { label: 'T', value: 'Tue' },
        { label: 'W', value: 'Wed' },
        { label: 'T', value: 'Thu' },
        { label: 'F', value: 'Fri' },
        { label: 'S', value: 'Sat' },
    ];

    useEffect(() => {
        loadAllSettings();
    }, []);

    const loadAllSettings = async () => {
        try {
            setLoading(true);
            const [settingsRes, adminRes] = await Promise.all([
                settingsAPI.get(),
                authAPI.getMe()
            ]);

            if (settingsRes.success) {
                const data = settingsRes.data;
                // Map API data to state
                setOrgSettings({
                    companyName: data.companyName,
                    shortName: data.shortName,
                    timeZone: data.timeZone,
                });
                setWorkDays(data.workDays);
                setAttendanceRules({
                    startTime: data.officeStartTime,
                    endTime: data.officeEndTime,
                    lateGrace: data.lateGraceMinutes,
                    halfDayAfter: data.halfDayAfter,
                    absentBy: data.markAbsentBy,
                    autoApprove: data.autoApproveHolidayLeaves,
                    officeIP: data.officeIP || '',
                });

                // Map Leave Settings
                setLeaveSettings({
                    monthlyCasualLimit: data.monthlyCasualLeaveLimit !== undefined ? data.monthlyCasualLeaveLimit : 1,
                    maxLeavesPerMonth: data.maxLeavesPerMonth !== undefined ? data.maxLeavesPerMonth : 2,
                    minNoticeDays: data.minLeaveNoticeDays !== undefined ? data.minLeaveNoticeDays : 0,
                });

                // Map Salary Settings
                setSalarySettings({
                    currency: data.salaryCurrency || '₹',
                    paymentDate: data.salaryPaymentDate || 1,
                    periodStartDate: data.payPeriodStartDate || 1,
                    basicPercent: data.basicSalaryPercent || 40,
                    hraPercent: data.hraPercent || 50,
                    conveyance: data.conveyanceAllowance || 0,
                    medical: data.medicalAllowance || 0,
                    overtimeEnabled: data.overtimeEnabled || false,
                    overtimeRate: data.overtimeRate || 1.5,
                    lopEnabled: data.lopEnabled !== undefined ? data.lopEnabled : true,
                    pfPercent: data.pfDeductionPercent || 12,
                    esiPercent: data.esiDeductionPercent || 0.75,
                    professionalTax: data.professionalTax || 0,
                    tdsPercent: data.tdsPercent || 0,
                    allowAdvance: data.allowAdvance || false,
                    maxAdvancePercent: data.maxAdvancePercent || 50,
                    advanceMonths: data.advanceDeductionMonths || 3,
                    performanceBonusEnabled: data.performanceBonusEnabled || false,
                    festivalBonus: data.festivalBonus || 0,
                    attendanceBonus: data.attendanceBonus || 0,
                });

                // Map notification settings
                setAdminSettings(prev => ({
                    ...prev,
                    notifyLeave: data.notifyLeave || false,
                    notifyAttendance: data.notifyAttendance || false,
                }));
            }

            if (adminRes.success && adminRes.admin) {
                setAdminSettings(prev => ({
                    ...prev,
                    email: adminRes.admin.email || '',
                    phone: adminRes.admin.phone || '',
                }));
            }

        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Update Global Settings
            const settingsPayload = {
                // Organization
                companyName: orgSettings.companyName,
                shortName: orgSettings.shortName,
                timeZone: orgSettings.timeZone,
                workDays: workDays,

                // Attendance Rules
                officeStartTime: attendanceRules.startTime,
                officeEndTime: attendanceRules.endTime,
                lateGraceMinutes: attendanceRules.lateGrace,
                halfDayAfter: attendanceRules.halfDayAfter,
                markAbsentBy: attendanceRules.absentBy,
                autoApproveHolidayLeaves: attendanceRules.autoApprove,
                officeIP: attendanceRules.officeIP,

                // Leave Rules
                monthlyCasualLeaveLimit: leaveSettings.monthlyCasualLimit,
                maxLeavesPerMonth: leaveSettings.maxLeavesPerMonth,
                minLeaveNoticeDays: leaveSettings.minNoticeDays,

                // Salary & Payroll
                salaryCurrency: salarySettings.currency,
                salaryPaymentDate: salarySettings.paymentDate,
                payPeriodStartDate: salarySettings.periodStartDate,
                basicSalaryPercent: salarySettings.basicPercent,
                hraPercent: salarySettings.hraPercent,
                conveyanceAllowance: salarySettings.conveyance,
                medicalAllowance: salarySettings.medical,
                overtimeEnabled: salarySettings.overtimeEnabled,
                overtimeRate: salarySettings.overtimeRate,
                lopEnabled: salarySettings.lopEnabled,
                pfDeductionPercent: salarySettings.pfPercent,
                esiDeductionPercent: salarySettings.esiPercent,
                professionalTax: salarySettings.professionalTax,
                tdsPercent: salarySettings.tdsPercent,
                allowAdvance: salarySettings.allowAdvance,
                maxAdvancePercent: salarySettings.maxAdvancePercent,
                advanceDeductionMonths: salarySettings.advanceMonths,
                performanceBonusEnabled: salarySettings.performanceBonusEnabled,
                festivalBonus: salarySettings.festivalBonus,
                attendanceBonus: salarySettings.attendanceBonus,

                // Notifications
                notifyLeave: adminSettings.notifyLeave,
                notifyAttendance: adminSettings.notifyAttendance,
            };

            const settingsPromise = settingsAPI.update(settingsPayload);

            // 2. Update Admin Details (if changed)
            let authPromise = Promise.resolve({ success: true });
            if (adminSettings.email || adminSettings.phone) {
                authPromise = authAPI.updateDetails({
                    email: adminSettings.email,
                    phone: adminSettings.phone
                });
            }

            // 3. Update Password (if provided)
            let passwordPromise = Promise.resolve({ success: true });
            if (adminSettings.newPassword) {
                if (adminSettings.newPassword !== adminSettings.confirmPassword) {
                    toast.error("Passwords do not match");
                    setSaving(false);
                    return;
                }
                passwordPromise = authAPI.updatePassword({ newPassword: adminSettings.newPassword });
            }

            const [sRes, aRes, pRes] = await Promise.all([settingsPromise, authPromise, passwordPromise]);

            if (!sRes.success) throw new Error(sRes.message || 'Failed to update settings');
            if (!aRes.success) throw new Error(aRes.message || 'Failed to update admin profile');
            if (!pRes.success) throw new Error(pRes.message || 'Failed to update password');

            toast.success('All settings saved successfully');

            // Clear password fields
            setAdminSettings(prev => ({
                ...prev,
                newPassword: '',
                confirmPassword: ''
            }));

        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error(error.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const toggleWorkDay = (dayValue) => {
        if (workDays.includes(dayValue)) {
            setWorkDays(workDays.filter((d) => d !== dayValue));
        } else {
            setWorkDays([...workDays, dayValue]);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-sm sm:text-base font-semibold text-slate-800">Settings</h2>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                        Configure organization details, attendance rules and admin account
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
                >
                    Restore defaults
                </button>
            </div>

            {/* 2-column layout */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                {/* Left: section nav */}
                <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm shadow-slate-200/60 text-[11px]">
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">Sections</p>
                    <ul className="space-y-1">
                        {sections.map((section) => (
                            <li
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={`rounded-xl px-3 py-2 text-xs cursor-pointer flex items-center justify-between ${activeSection === section
                                    ? 'bg-sky-50 text-sky-800 font-medium'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <span>{section}</span>
                                {activeSection === section && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right: forms */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Organization settings */}
                    {activeSection === 'Organization' && (
                        <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60">
                            <div className="mb-3 border-b border-slate-100 pb-3">
                                <p className="text-sm font-semibold text-slate-800">Organization</p>
                                <p className="text-[11px] text-slate-500">
                                    Basic details used across reports, emails and attendance screens
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Company name</label>
                                    <input
                                        type="text"
                                        value={orgSettings.companyName}
                                        onChange={(e) => setOrgSettings({ ...orgSettings, companyName: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Short name</label>
                                    <input
                                        type="text"
                                        value={orgSettings.shortName}
                                        onChange={(e) => setOrgSettings({ ...orgSettings, shortName: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Time zone</label>
                                    <select
                                        value={orgSettings.timeZone}
                                        onChange={(e) => setOrgSettings({ ...orgSettings, timeZone: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    >
                                        <option>Asia/Kolkata</option>
                                        <option>UTC</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Work days</label>
                                    <div className="grid grid-cols-7 gap-1 rounded-xl border border-slate-200 px-2 py-1 bg-slate-50">
                                        {days.map((day, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => toggleWorkDay(day.value)}
                                                className={`text-[10px] px-1.5 py-1 rounded-lg ${workDays.includes(day.value)
                                                    ? 'bg-sky-600 text-white'
                                                    : 'text-slate-500'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Attendance rules */}
                    {activeSection === 'Attendance rules' && (
                        <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60">
                            <div className="mb-3 border-b border-slate-100 pb-3">
                                <p className="text-sm font-semibold text-slate-800">Attendance rules</p>
                                <p className="text-[11px] text-slate-500">
                                    Define office timings, grace periods and half-day logic
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Office start time</label>
                                    <input
                                        type="time"
                                        value={attendanceRules.startTime}
                                        onChange={(e) => setAttendanceRules({ ...attendanceRules, startTime: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Office end time</label>
                                    <input
                                        type="time"
                                        value={attendanceRules.endTime}
                                        onChange={(e) => setAttendanceRules({ ...attendanceRules, endTime: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Late grace (minutes)</label>
                                    <input
                                        type="number"
                                        value={attendanceRules.lateGrace}
                                        onChange={(e) => setAttendanceRules({ ...attendanceRules, lateGrace: parseInt(e.target.value) })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Half-day if in after</label>
                                    <input
                                        type="time"
                                        value={attendanceRules.halfDayAfter}
                                        onChange={(e) => setAttendanceRules({ ...attendanceRules, halfDayAfter: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>

                                <div className="flex flex-col md:col-span-2">
                                    <label className="mb-1 font-medium text-slate-600">Mark absent if no check-in by</label>
                                    <input
                                        type="time"
                                        value={attendanceRules.absentBy}
                                        onChange={(e) => setAttendanceRules({ ...attendanceRules, absentBy: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>

                                <div className="flex flex-col md:col-span-3">
                                    <label className="mb-1 font-medium text-slate-600">Office IP Address for Validation (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 192.168.1.1"
                                        value={attendanceRules.officeIP}
                                        onChange={(e) => setAttendanceRules({ ...attendanceRules, officeIP: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        If set, employees can only mark attendance when connected to this IP network.
                                    </p>
                                </div>

                                <div className="flex flex-col justify-end md:col-span-3">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                const res = await settingsAPI.getCurrentIP();
                                                if (res.success && res.ip) {
                                                    setAttendanceRules(prev => ({ ...prev, officeIP: res.ip }));
                                                    toast.success(`IP detected: ${res.ip}`);
                                                } else {
                                                    toast.error('Could not detect IP');
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                toast.error('Failed to detect IP');
                                            }
                                        }}
                                        className="inline-flex max-w-fit items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-medium text-sky-700 hover:bg-sky-100"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wifi"><path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 12a5 5 0 0 1 5 5" /><path d="M4.93 19.07a10 10 0 0 1-2.93-7.07" /><path d="M22 12A10 10 0 0 0 12 2v0a10 10 0 0 0-10 10" /><path d="M8.5 15.5A5 5 0 0 1 12 12v0a5 5 0 0 1 3.5 1.5" /><path d="M12 22v0" /></svg>
                                        Auto-detect current WiFi IP
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2 text-[11px]">
                                <input
                                    id="auto-approve"
                                    type="checkbox"
                                    checked={attendanceRules.autoApprove}
                                    onChange={(e) => setAttendanceRules({ ...attendanceRules, autoApprove: e.target.checked })}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                <label htmlFor="auto-approve" className="text-slate-600">
                                    Auto-approve leave requests that exactly match configured holidays
                                </label>
                            </div>
                        </section>
                    )}

                    {/* Leave rules */}
                    {activeSection === 'Leave types' && (
                        <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60">
                            <div className="mb-3 border-b border-slate-100 pb-3">
                                <p className="text-sm font-semibold text-slate-800">Leave rules</p>
                                <p className="text-[11px] text-slate-500">
                                    Configure leave limits and notice periods
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Monthly Casual Leave Limit</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={leaveSettings.monthlyCasualLimit}
                                        onChange={(e) => setLeaveSettings({ ...leaveSettings, monthlyCasualLimit: parseInt(e.target.value) || 0 })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Max Leaves Per Month (Total)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={leaveSettings.maxLeavesPerMonth}
                                        onChange={(e) => setLeaveSettings({ ...leaveSettings, maxLeavesPerMonth: parseInt(e.target.value) || 0 })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Min Notice Days (in advance)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={leaveSettings.minNoticeDays}
                                        onChange={(e) => setLeaveSettings({ ...leaveSettings, minNoticeDays: parseInt(e.target.value) || 0 })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        0 = can apply same day
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Salary & Payroll */}
                    {activeSection === 'Salary & Payroll' && (
                        <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60">
                            <div className="mb-3 border-b border-slate-100 pb-3">
                                <p className="text-sm font-semibold text-slate-800">Salary & Payroll</p>
                                <p className="text-[11px] text-slate-500">
                                    Configure salary structure, deductions, bonuses and payment schedules
                                </p>
                            </div>

                            {/* General Payroll */}
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-slate-700 mb-2">General Settings</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Currency Symbol</label>
                                        <input
                                            type="text"
                                            value={salarySettings.currency}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, currency: e.target.value })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Salary Payment Date (Day of Month)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={salarySettings.paymentDate}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, paymentDate: parseInt(e.target.value) || 1 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">1 = 1st of every month</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Pay Period Start Date</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={salarySettings.periodStartDate}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, periodStartDate: parseInt(e.target.value) || 1 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">Period: 1st to 30th/31st</p>
                                    </div>
                                </div>
                            </div>

                            {/* Salary Structure */}
                            <div className="mb-4 border-t border-slate-100 pt-3">
                                <p className="text-xs font-semibold text-slate-700 mb-2">Salary Structure</p>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Basic Salary %</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={salarySettings.basicPercent}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, basicPercent: parseInt(e.target.value) || 0 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">% of CTC</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">HRA %</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={salarySettings.hraPercent}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, hraPercent: parseInt(e.target.value) || 0 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">% of Basic</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Conveyance ({salarySettings.currency})</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={salarySettings.conveyance}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, conveyance: parseInt(e.target.value) || 0 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Medical ({salarySettings.currency})</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={salarySettings.medical}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, medical: parseInt(e.target.value) || 0 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div className="mb-4 border-t border-slate-100 pt-3">
                                <p className="text-xs font-semibold text-slate-700 mb-2">Deductions</p>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">PF %</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={salarySettings.pfPercent}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, pfPercent: parseFloat(e.target.value) || 0 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">% of Basic</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">ESI %</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={salarySettings.esiPercent}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, esiPercent: parseFloat(e.target.value) || 0 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Prof. Tax ({salarySettings.currency})</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={salarySettings.professionalTax}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, professionalTax: parseInt(e.target.value) || 0 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">TDS %</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={salarySettings.tdsPercent}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, tdsPercent: parseFloat(e.target.value) || 0 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Overtime & Attendance */}
                            <div className="mb-4 border-t border-slate-100 pt-3">
                                <p className="text-xs font-semibold text-slate-700 mb-2">Overtime & Attendance</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="overtime-enabled"
                                            type="checkbox"
                                            checked={salarySettings.overtimeEnabled}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, overtimeEnabled: e.target.checked })}
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        <label htmlFor="overtime-enabled" className="text-slate-600">Enable Overtime Pay</label>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Overtime Rate (Multiplier)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="3"
                                            step="0.1"
                                            value={salarySettings.overtimeRate}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, overtimeRate: parseFloat(e.target.value) || 1.5 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                            disabled={!salarySettings.overtimeEnabled}
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">1.5 = 1.5x hourly rate</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="lop-enabled"
                                            type="checkbox"
                                            checked={salarySettings.lopEnabled}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, lopEnabled: e.target.checked })}
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        <label htmlFor="lop-enabled" className="text-slate-600">Enable Loss of Pay (LOP) for Absents</label>
                                    </div>
                                </div>
                            </div>

                            {/* Advance Salary */}
                            <div className="mb-4 border-t border-slate-100 pt-3">
                                <p className="text-xs font-semibold text-slate-700 mb-2">Advance Salary</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="allow-advance"
                                            type="checkbox"
                                            checked={salarySettings.allowAdvance}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, allowAdvance: e.target.checked })}
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        <label htmlFor="allow-advance" className="text-slate-600">Allow Salary Advance Requests</label>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Max Advance %</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={salarySettings.maxAdvancePercent}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, maxAdvancePercent: parseInt(e.target.value) || 50 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                            disabled={!salarySettings.allowAdvance}
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">% of monthly salary</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Deduct Over (Months)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={salarySettings.advanceMonths}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, advanceMonths: parseInt(e.target.value) || 3 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                            disabled={!salarySettings.allowAdvance}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bonuses */}
                            <div className="border-t border-slate-100 pt-3">
                                <p className="text-xs font-semibold text-slate-700 mb-2">Bonuses & Incentives</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="performance-bonus"
                                            type="checkbox"
                                            checked={salarySettings.performanceBonusEnabled}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, performanceBonusEnabled: e.target.checked })}
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        <label htmlFor="performance-bonus" className="text-slate-600">Enable Performance Bonus</label>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Festival Bonus ({salarySettings.currency})</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={salarySettings.festivalBonus}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, festivalBonus: parseInt(e.target.value) || 0 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">Fixed amount per year</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Attendance Bonus ({salarySettings.currency})</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={salarySettings.attendanceBonus}
                                            onChange={(e) => setSalarySettings({ ...salarySettings, attendanceBonus: parseInt(e.target.value) || 0 })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">For 100% attendance</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Admin account & security */}
                    {activeSection === 'Admin account' && (
                        <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60">
                            <div className="mb-3 border-b border-slate-100 pb-3">
                                <p className="text-sm font-semibold text-slate-800">Admin account & security</p>
                                <p className="text-[11px] text-slate-500">
                                    Update login email, password and notification preferences
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Admin email</label>
                                    <input
                                        type="email"
                                        value={adminSettings.email}
                                        onChange={(e) => setAdminSettings({ ...adminSettings, email: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Phone for alerts</label>
                                    <input
                                        type="tel"
                                        placeholder="+91 ..."
                                        value={adminSettings.phone}
                                        onChange={(e) => setAdminSettings({ ...adminSettings, phone: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">New password</label>
                                    <input
                                        type="password"
                                        placeholder="Leave blank to keep current"
                                        value={adminSettings.newPassword}
                                        onChange={(e) => setAdminSettings({ ...adminSettings, newPassword: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Confirm new password</label>
                                    <input
                                        type="password"
                                        value={adminSettings.confirmPassword}
                                        onChange={(e) => setAdminSettings({ ...adminSettings, confirmPassword: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>
                            </div>

                            <div className="mt-3 space-y-2 text-[11px]">
                                <p className="font-medium text-slate-600">Notifications</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="notif-leave"
                                        type="checkbox"
                                        checked={adminSettings.notifyLeave}
                                        onChange={(e) => setAdminSettings({ ...adminSettings, notifyLeave: e.target.checked })}
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    <label htmlFor="notif-leave" className="text-slate-600">
                                        Email me when a new leave request is created
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="notif-att"
                                        type="checkbox"
                                        checked={adminSettings.notifyAttendance}
                                        onChange={(e) => setAdminSettings({ ...adminSettings, notifyAttendance: e.target.checked })}
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    <label htmlFor="notif-att" className="text-slate-600">
                                        Email daily attendance summary
                                    </label>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Common Save Buttons */}
                    <div className="mt-4 flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/60 sticky bottom-4">
                        <button
                            className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50"
                            onClick={() => window.location.reload()}
                        >
                            Cancel changes
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-[11px] font-medium text-white shadow-sm shadow-emerald-500/40 hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save all changes'}
                        </button>
                    </div>
                </div>
            </section >
        </>
    );
}

export default Settings;
