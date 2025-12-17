const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const { protect, protectAny, protectEmployee } = require('../middleware/auth');

// @route   GET /api/leaves
// @desc    Get all leave requests
// @access  Private (Admin or Employee for their own)
router.get('/', protectAny, async (req, res) => {
    try {
        const { status, employee } = req.query;

        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        // If employee, force filtering by their ID
        if (req.userType === 'employee') {
            query.employee = req.employee._id;
        } else if (employee) {
            query.employee = employee;
        }

        const leaves = await LeaveRequest.find(query)
            .populate('employee', 'name empId department profilePhoto')
            .populate('reviewedBy', 'name')
            .sort({ appliedAt: -1 });

        res.json({
            success: true,
            count: leaves.length,
            data: leaves,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   GET /api/leaves/pending
// @desc    Get pending leave requests count
// @access  Private
router.get('/pending', protect, async (req, res) => {
    try {
        const count = await LeaveRequest.countDocuments({ status: 'pending' });
        res.json({
            success: true,
            count,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   GET /api/leaves/:id
// @desc    Get single leave request
// @access  Private
router.get('/:id', protectAny, async (req, res) => {
    try {
        const leave = await LeaveRequest.findById(req.params.id)
            .populate('employee', 'name empId department email profilePhoto')
            .populate('reviewedBy', 'name');

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found',
            });
        }

        // If employee, ensure they own the leave
        if (req.userType === 'employee' && leave.employee._id.toString() !== req.employee._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        res.json({
            success: true,
            data: leave,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

const Settings = require('../models/Settings');

// @route   POST /api/leaves
// @desc    Create leave request (will be used by employee app)
// @access  Private
router.post('/', protectAny, async (req, res) => {
    try {
        // Enforce employee field if regular employee
        if (req.userType === 'employee') {
            req.body.employee = req.employee._id;
        }

        const { startDate, leaveType, employee } = req.body;

        // --- VALIDATION RULES (From Settings) ---
        const settings = await Settings.findOne();
        if (settings) {
            const start = new Date(startDate);
            const today = new Date();

            // 1. Min Leave Notice Days
            const diffTime = start.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < settings.minLeaveNoticeDays) {
                return res.status(400).json({
                    success: false,
                    message: `Leave must be applied at least ${settings.minLeaveNoticeDays} days in advance.`
                });
            }

            // 2. Max Leaves Per Month + Casual Leave Limit
            const startMonth = start.getMonth();
            const startYear = start.getFullYear();

            // Find all leaves for this employee in the same month
            // We consider leaves that overlap with the requested month or start in the same month
            // For simplicity, just checking start date's month for now as most casual leaves are short
            const monthLeaves = await LeaveRequest.find({
                employee: employee,
                status: { $ne: 'rejected' }, // Count pending and approved
                $expr: {
                    $and: [
                        { $eq: [{ $month: '$startDate' }, startMonth + 1] }, // MongoDB month is 1-based
                        { $eq: [{ $year: '$startDate' }, startYear] }
                    ]
                }
            });

            // Calculate total days taken
            let totalDaysTaken = 0;
            let casualDaysTaken = 0;

            monthLeaves.forEach(l => {
                const s = new Date(l.startDate);
                const e = new Date(l.endDate);
                const days = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
                totalDaysTaken += days;
                if (l.leaveType === 'Casual Leave') casualDaysTaken += days;
            });

            // Calculate requested days
            const reqStart = new Date(startDate);
            const reqEnd = new Date(req.body.endDate);
            const reqDays = Math.floor((reqEnd - reqStart) / (1000 * 60 * 60 * 24)) + 1;

            if (totalDaysTaken + reqDays > settings.maxLeavesPerMonth) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot exceed ${settings.maxLeavesPerMonth} leaves per month. You have already taken/applied for ${totalDaysTaken} days.`
                });
            }

            if (leaveType === 'Casual Leave') {
                if (casualDaysTaken + reqDays > settings.monthlyCasualLeaveLimit) {
                    return res.status(400).json({
                        success: false,
                        message: `Casual Leave limit is ${settings.monthlyCasualLeaveLimit} per month. You have already used ${casualDaysTaken} days.`
                    });
                }
            }
        }
        // ----------------------------------------

        const leave = await LeaveRequest.create(req.body);

        res.status(201).json({
            success: true,
            data: leave,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   PUT /api/leaves/:id/approve
// @desc    Approve leave request
// @access  Private
router.put('/:id/approve', protect, async (req, res) => {
    try {
        const leave = await LeaveRequest.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found',
            });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Leave request already processed',
            });
        }

        leave.status = 'approved';
        leave.reviewedBy = req.admin._id;
        leave.reviewedAt = new Date();
        await leave.save();

        // Mark attendance as leave for the dates
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            await Attendance.findOneAndUpdate(
                { employee: leave.employee, date: new Date(d) },
                { status: 'leave', markedBy: 'admin' },
                { upsert: true, new: true }
            );
        }

        res.json({
            success: true,
            message: 'Leave request approved',
            data: leave,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   PUT /api/leaves/:id/reject
// @desc    Reject leave request
// @access  Private
router.put('/:id/reject', protect, async (req, res) => {
    try {
        const leave = await LeaveRequest.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found',
            });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Leave request already processed',
            });
        }

        leave.status = 'rejected';
        leave.reviewedBy = req.admin._id;
        leave.reviewedAt = new Date();
        leave.rejectionReason = req.body.reason || 'Rejected by admin';
        await leave.save();

        res.json({
            success: true,
            message: 'Leave request rejected',
            data: leave,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

module.exports = router;
