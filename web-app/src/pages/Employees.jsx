import { useState, useEffect } from 'react';
import { employeesAPI } from '../services/api';

function Employees() {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSalarySlip, setShowSalarySlip] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        empId: '',
        email: '',
        password: '',
        department: 'Development',
        role: 'Employee',
        phone: '',
        joiningDate: '',
        salary: '',
        status: 'active',
    });

    // Fetch employees on mount
    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await employeesAPI.getAll();
            if (res.success) {
                setEmployees(res.data);
                if (res.data.length > 0 && !selectedEmployee) {
                    setSelectedEmployee(res.data[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(
        (emp) =>
            emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.empId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const resetForm = () => {
        setFormData({
            name: '',
            empId: '',
            email: '',
            password: '',
            department: 'Development',
            role: 'Employee',
            phone: '',
            joiningDate: '',
            salary: '',
            status: 'active',
        });
        setEditMode(false);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (emp) => {
        setFormData({
            name: emp.name,
            empId: emp.empId,
            email: emp.email,
            department: emp.department,
            role: emp.role,
            phone: emp.phone || '',
            joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
            salary: emp.salary || '',
            status: emp.status,
        });
        setEditMode(true);
        setSelectedEmployee(emp);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let res;
            if (editMode && selectedEmployee) {
                res = await employeesAPI.update(selectedEmployee._id, formData);
            } else {
                res = await employeesAPI.create(formData);
            }

            if (res.success) {
                setShowModal(false);
                resetForm();
                fetchEmployees();
            } else {
                alert(res.message || 'Error saving employee');
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Error saving employee');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;

        try {
            const res = await employeesAPI.delete(id);
            if (res.success) {
                setSelectedEmployee(null);
                fetchEmployees();
            } else {
                alert(res.message || 'Error deleting employee');
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    };

    const getInitials = (name) => {
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <>
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-sm sm:text-base font-semibold text-slate-800">Employees</h2>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                        Manage employee profiles, roles and status
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                    <input
                        type="text"
                        placeholder="Search name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="hidden sm:block rounded-full border border-slate-200 px-3 py-1.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                    />
                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center rounded-full bg-[#0B2854] text-sky-50 px-3 py-1.5 text-[11px] font-medium shadow-sm shadow-blue-900/40 hover:bg-slate-900"
                    >
                        + Add employee
                    </button>
                </div>
            </div>

            {/* Filters */}
            <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                    <div className="flex flex-col">
                        <label className="mb-1 font-medium text-slate-600">Department</label>
                        <select className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60">
                            <option>All departments</option>
                            <option>Development</option>
                            <option>HR</option>
                            <option>Support</option>
                            <option>Marketing</option>
                            <option>Finance</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 font-medium text-slate-600">Role</label>
                        <select className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60">
                            <option>All roles</option>
                            <option>Admin</option>
                            <option>Manager</option>
                            <option>Employee</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 font-medium text-slate-600">Status</label>
                        <select className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60">
                            <option>All</option>
                            <option>Active only</option>
                            <option>Inactive only</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Loading state */}
            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading employees...</div>
            ) : (
                /* Two-column layout: table + detail card */
                <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
                    {/* Left: employees table */}
                    <div className="xl:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/60">
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Employee list</p>
                                    <p className="text-[11px] text-slate-500">Click a row to view or edit details</p>
                                </div>
                                <div className="flex items-center gap-2 text-[11px]">
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Active</span>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Inactive</span>
                                </div>
                            </div>

                            {employees.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 text-sm">
                                    No employees found. Click "Add employee" to create one.
                                </div>
                            ) : (
                                <div className="max-h-80 overflow-y-auto">
                                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                                        <thead className="bg-slate-50/80 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium text-slate-500 bg-slate-50/90">Name</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-500 bg-slate-50/90">Emp ID</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-500 bg-slate-50/90">Role</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-500 bg-slate-50/90">Department</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-500 bg-slate-50/90">Status</th>
                                                <th className="px-4 py-2 text-right font-medium text-slate-500 bg-slate-50/90">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredEmployees.map((emp) => (
                                                <tr
                                                    key={emp._id}
                                                    onClick={() => setSelectedEmployee(emp)}
                                                    className={`cursor-pointer ${selectedEmployee?._id === emp._id ? 'bg-sky-50/60 hover:bg-sky-50' : 'hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center bg-slate-200">
                                                                {emp.profilePhoto ? (
                                                                    <img
                                                                        src={emp.profilePhoto}
                                                                        alt={emp.name}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className={`h-full w-full flex items-center justify-center text-[11px] font-semibold ${selectedEmployee?._id === emp._id
                                                                        ? 'bg-sky-100 text-sky-700'
                                                                        : 'bg-slate-200 text-slate-700'
                                                                        }`}>
                                                                        {getInitials(emp.name)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-800">{emp.name}</p>
                                                                <p className="text-[11px] text-slate-500">{emp.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-600">{emp.empId}</td>
                                                    <td className="px-4 py-2 text-slate-700">{emp.role}</td>
                                                    <td className="px-4 py-2 text-slate-700">{emp.department}</td>
                                                    <td className="px-4 py-2">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${emp.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                                }`}
                                                        >
                                                            {emp.status === 'active' ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-slate-500">{formatDate(emp.joiningDate)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500">
                                <p>Showing {filteredEmployees.length} of {employees.length} employees</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: compact detail card */}
                    {selectedEmployee && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm shadow-slate-200/60 transition-all">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-sm shadow-blue-500/40 flex items-center justify-center bg-gray-100">
                                    {selectedEmployee.profilePhoto ? (
                                        <img
                                            src={selectedEmployee.profilePhoto}
                                            alt={selectedEmployee.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] flex items-center justify-center text-[13px] font-semibold text-sky-50">
                                            {getInitials(selectedEmployee.name)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-800">{selectedEmployee.name}</p>
                                    <p className="text-[11px] text-slate-500">
                                        {selectedEmployee.role} · {selectedEmployee.empId} · {selectedEmployee.department}
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${selectedEmployee.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-600'
                                        }`}
                                >
                                    {selectedEmployee.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-[11px] mb-3">
                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                    <p className="text-slate-500">Email</p>
                                    <p className="mt-1 font-medium text-slate-800">{selectedEmployee.email}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                    <p className="text-slate-500">Phone</p>
                                    <p className="mt-1 font-medium text-slate-800">{selectedEmployee.phone || '-'}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                    <p className="text-slate-500">Joined</p>
                                    <p className="mt-1 font-medium text-slate-800">{formatDate(selectedEmployee.joiningDate)}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                    <p className="text-slate-500">Role</p>
                                    <p className="mt-1 font-medium text-slate-800">{selectedEmployee.role}</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 px-3 py-2">
                                    <p className="text-slate-500">Salary</p>
                                    <p className="mt-1 font-medium text-emerald-700">₹{selectedEmployee.salary?.toLocaleString() || '0'}/mo</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-[11px]">
                                <p className="font-medium text-slate-600">Quick actions</p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setShowSalarySlip(true)}
                                        className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-700 hover:bg-emerald-100"
                                    >
                                        💰 Salary Slip
                                    </button>
                                    <button
                                        onClick={() => openEditModal(selectedEmployee)}
                                        className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
                                    >
                                        Edit profile
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedEmployee._id)}
                                        className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] text-rose-700 hover:bg-rose-100"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Add/Edit Employee Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
                    onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
                >
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    {editMode ? 'Edit employee' : 'Add new employee'}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    {editMode ? 'Update employee details' : 'Basic details will be used for attendance and leave modules'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs hover:bg-slate-200"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
                            <div className="flex flex-col">
                                <label className="mb-1 font-medium text-slate-600">Full name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    placeholder="e.g. Rahul Kumar"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Employee ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.empId}
                                        onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        placeholder="EMP-XXXX"
                                        disabled={editMode}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Department</label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    >
                                        <option>Development</option>
                                        <option>HR</option>
                                        <option>Support</option>
                                        <option>Marketing</option>
                                        <option>Finance</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    >
                                        <option>Employee</option>
                                        <option>Manager</option>
                                        <option>Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                        placeholder="+91 ..."
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Joining date</label>
                                    <input
                                        type="date"
                                        value={formData.joiningDate}
                                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 font-medium text-slate-600">Salary (per month)</label>
                                <input
                                    type="number"
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    placeholder="e.g. 50000"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium text-slate-600">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                {!editMode && (
                                    <div className="flex flex-col">
                                        <label className="mb-1 font-medium text-slate-600">Password (optional)</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60"
                                            placeholder="Leave blank for email"
                                        />
                                    </div>
                                )}
                            </div>
                            {!editMode && (
                                <p className="text-[10px] text-slate-400">
                                    * If password is blank, employee's email will be used as default password
                                </p>
                            )}

                            <div className="flex items-center justify-between gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-[11px] font-medium text-white shadow-sm shadow-emerald-500/40 hover:bg-emerald-700"
                                >
                                    {editMode ? 'Update employee' : 'Save employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Salary Slip Modal */}
            {showSalarySlip && selectedEmployee && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
                    onClick={(e) => e.target === e.currentTarget && setShowSalarySlip(false)}
                >
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.35)] border border-slate-200 overflow-hidden">
                        {/* BG logo watermark */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
                            <div className="text-8xl font-bold text-[#0b2854]">P</div>
                        </div>

                        {/* Inner content */}
                        <div className="relative z-10 p-4 sm:p-5 space-y-3 max-h-[80vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Salary Slip
                                    </p>
                                    <p className="text-base font-semibold text-slate-900">
                                        Monthly Pay Statement
                                    </p>
                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                        {selectedEmployee.name} • {selectedEmployee.empId}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowSalarySlip(false)}
                                    className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 text-sm"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Employee + pay details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                                    <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                                        Employee details
                                    </p>
                                    <p className="text-[11px] text-slate-500">Name</p>
                                    <p className="font-medium text-slate-900 text-[13px]">{selectedEmployee.name}</p>

                                    <p className="mt-1.5 text-[11px] text-slate-500">Employee ID</p>
                                    <p className="font-semibold text-slate-900 text-[13px]">{selectedEmployee.empId}</p>

                                    <p className="mt-1.5 text-[11px] text-slate-500">Department</p>
                                    <p className="font-medium text-slate-900 text-[13px]">{selectedEmployee.department}</p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                                    <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                                        Pay details
                                    </p>
                                    <p className="text-[11px] text-slate-500">Pay period</p>
                                    <p className="font-medium text-slate-900 text-[13px]">
                                        01 {new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} – {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} {new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                    </p>

                                    <p className="mt-1.5 text-[11px] text-slate-500">Pay date</p>
                                    <p className="font-semibold text-slate-900 text-[13px]">
                                        05 {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Earnings & Deductions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {/* Earnings */}
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 overflow-hidden">
                                    <div className="px-3 py-2 bg-emerald-100 border-b border-emerald-200 flex items-center justify-between">
                                        <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">Earnings</p>
                                        <p className="text-[11px] text-emerald-800">Amount (₹)</p>
                                    </div>
                                    <div className="divide-y divide-emerald-100 text-[11px] text-slate-800">
                                        <div className="flex items-center justify-between px-3 py-1.5">
                                            <p>Basic Salary</p>
                                            <p className="font-semibold">{Math.round((selectedEmployee.salary || 0) * 0.5).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-1.5">
                                            <p>HRA</p>
                                            <p className="font-semibold">{Math.round((selectedEmployee.salary || 0) * 0.2).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-1.5">
                                            <p>Conveyance</p>
                                            <p className="font-semibold">{Math.round((selectedEmployee.salary || 0) * 0.1).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-1.5">
                                            <p>Special Allowance</p>
                                            <p className="font-semibold">{Math.round((selectedEmployee.salary || 0) * 0.2).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-100">
                                            <p className="font-semibold">Gross</p>
                                            <p className="font-bold text-emerald-800">{(selectedEmployee.salary || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div className="rounded-xl border border-rose-200 bg-rose-50/70 overflow-hidden">
                                    <div className="px-3 py-2 bg-rose-100 border-b border-rose-200 flex items-center justify-between">
                                        <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wide">Deductions</p>
                                        <p className="text-[11px] text-rose-800">Amount (₹)</p>
                                    </div>
                                    <div className="divide-y divide-rose-100 text-[11px] text-slate-800">
                                        <div className="flex items-center justify-between px-3 py-1.5">
                                            <p>EPF (12%)</p>
                                            <p className="font-semibold">{Math.round((selectedEmployee.salary || 0) * 0.12).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-1.5">
                                            <p>Professional Tax</p>
                                            <p className="font-semibold">0</p>
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-1.5">
                                            <p>TDS</p>
                                            <p className="font-semibold">{Math.round((selectedEmployee.salary || 0) * 0.05).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-1.5 bg-rose-100">
                                            <p className="font-semibold">Total</p>
                                            <p className="font-bold text-rose-800">
                                                {(Math.round((selectedEmployee.salary || 0) * 0.12) + 0 + Math.round((selectedEmployee.salary || 0) * 0.05)).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Net + actions */}
                            <div className="space-y-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                                    <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">
                                        Net salary payable
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-lg font-bold text-emerald-700">
                                            ₹{((selectedEmployee.salary || 0) - Math.round((selectedEmployee.salary || 0) * 0.12) - 0 - Math.round((selectedEmployee.salary || 0) * 0.05)).toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            Per Month
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => setShowSalarySlip(false)}
                                        className="flex-1 rounded-xl border border-slate-200 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="flex-1 rounded-xl bg-slate-900 py-2 text-sm font-medium text-white shadow-sm shadow-slate-400/40 hover:bg-slate-800"
                                    >
                                        Download PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Employees;
