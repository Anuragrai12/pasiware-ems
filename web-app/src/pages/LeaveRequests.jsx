import { useState, useEffect } from 'react';
import { leavesAPI } from '../services/api';
import { toast } from 'react-hot-toast';

function LeaveRequests() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');

    useEffect(() => {
        fetchLeaves();

        const interval = setInterval(() => {
            fetchLeaves(true); // true = silent refresh
        }, 5000);

        return () => clearInterval(interval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchLeaves = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await leavesAPI.getAll();
            if (response.success) {
                setLeaveRequests(response.data);
            }
        } catch (error) {
            console.error('Error fetching leaves:', error);
            // toast.error('Failed to load leave requests');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const response = await leavesAPI.approve(id);
            if (response.success) {
                // toast.success('Leave approved successfully');
                fetchLeaves(); // Refresh list
            } else {
                // toast.error(response.message || 'Failed to approve');
            }
        } catch (error) {
            console.error('Approve error:', error);
            // toast.error('Something went wrong');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Are you sure you want to reject this leave request?')) return;

        const reason = prompt('Please enter rejection reason:');
        if (!reason) return;

        try {
            const response = await leavesAPI.reject(id, reason);
            if (response.success) {
                // toast.success('Leave rejected successfully');
                fetchLeaves(); // Refresh list
            } else {
                // toast.error(response.message || 'Failed to reject');
            }
        } catch (error) {
            console.error('Reject error:', error);
            // toast.error('Something went wrong');
        }
    };

    const filteredRequests = leaveRequests.filter(
        (req) => statusFilter === 'all' || req.status === statusFilter
    );

    // Date filtering logic could be added here if backend supports it or client-side

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-50 text-amber-700',
            approved: 'bg-emerald-50 text-emerald-700',
            rejected: 'bg-rose-50 text-rose-700',
        };
        const labels = {
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected',
        };
        return (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <>
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-sm sm:text-base font-semibold text-slate-800">Leave Requests</h2>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                        Review and approve or reject employee leave requests
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending only</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Desktop table */}
            <section className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/60 mt-4">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <p className="text-sm font-semibold text-slate-800">All requests</p>
                    </div>
                    {loading && <p className="text-xs text-slate-500">Loading...</p>}
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                        <thead className="bg-slate-50/80 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-slate-500 bg-slate-50/90">Employee</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-500 bg-slate-50/90">Type</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-500 bg-slate-50/90">Dates</th>
                                <th className="px-4 py-2 text-center font-medium text-slate-500 bg-slate-50/90">Days</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-500 bg-slate-50/90">Reason</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-500 bg-slate-50/90">Status</th>
                                <th className="px-4 py-2 text-right font-medium text-slate-500 bg-slate-50/90">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRequests.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                                        No leave requests found
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr
                                        key={req._id || req.id}
                                        className={req.status === 'pending' ? 'hover:bg-sky-50/70' : 'hover:bg-slate-50'}
                                    >
                                        <td className="px-4 py-2">
                                            <p className="font-medium text-slate-800">{req.employee?.name || 'Unknown'}</p>
                                            <p className="text-[11px] text-slate-500">{req.employee?.department || '-'} · {req.employee?.empId || '-'}</p>
                                        </td>
                                        <td className="px-4 py-2 text-slate-700">{req.type}</td>
                                        <td className="px-4 py-2 text-slate-700">
                                            {formatDate(req.startDate)} {req.startDate !== req.endDate ? `– ${formatDate(req.endDate)}` : ''}
                                        </td>
                                        <td className="px-4 py-2 text-center text-slate-700">{req.days}</td>
                                        <td className="px-4 py-2 text-slate-600 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                        <td className="px-4 py-2">{getStatusBadge(req.status)}</td>
                                        <td className="px-4 py-2">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleReject(req._id || req.id)}
                                                        className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] text-rose-700 hover:bg-rose-100"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(req._id || req.id)}
                                                        className="inline-flex items-center rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-[11px] text-white shadow-sm shadow-emerald-500/40 hover:bg-emerald-700"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-[10px] text-slate-400">
                                                        {req.status === 'approved' ? 'Approved' : 'Rejected'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Mobile cards */}
            <section className="md:hidden space-y-2 mt-4">
                {loading && <p className="text-center text-xs text-slate-500">Loading...</p>}

                {filteredRequests.map((req) => (
                    <div
                        key={req._id || req.id}
                        className="rounded-2xl border border-slate-100 bg-white px-3 py-3 text-xs flex flex-col gap-2"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-semibold text-slate-800">{req.employee?.name || 'Unknown'}</p>
                                <p className="text-[11px] text-slate-500">{req.employee?.department || '-'} · {req.employee?.empId || '-'}</p>
                            </div>
                            {getStatusBadge(req.status)}
                        </div>
                        <p className="text-[11px] text-slate-600">
                            {req.type} · {formatDate(req.startDate)} {req.startDate !== req.endDate ? `– ${formatDate(req.endDate)}` : ''} · {req.days} day{req.days > 1 ? 's' : ''}
                        </p>
                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                            {req.reason}
                        </div>
                        <div className="flex items-center justify-between gap-2 flex-wrap mt-1">
                            <span className="text-[10px] text-slate-400">Applied: {formatDate(req.appliedAt)}</span>
                            {req.status === 'pending' ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleReject(req._id || req.id)}
                                        className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] text-rose-700 hover:bg-rose-100"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(req._id || req.id)}
                                        className="inline-flex items-center rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-[11px] text-white shadow-sm shadow-emerald-500/40 hover:bg-emerald-700"
                                    >
                                        Approve
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ))}
            </section>
        </>
    );
}

export default LeaveRequests;
