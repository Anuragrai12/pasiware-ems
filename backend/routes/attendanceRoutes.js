const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { protect, protectAny } = require('../middleware/auth');

// @route   GET /api/attendance/stats
// @desc    Get dashboard attendance stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalEmployees = await Employee.countDocuments({ status: 'active' });

        const todayAttendance = await Attendance.find({
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
        });

        const presentToday = todayAttendance.filter(
            (a) => a.status === 'present' || a.status === 'late'
        ).length;

        const absentToday = totalEmployees - presentToday -
            todayAttendance.filter((a) => a.status === 'leave').length;

        const onLeaveToday = todayAttendance.filter((a) => a.status === 'leave').length;

        const lateToday = todayAttendance.filter((a) => a.status === 'late').length;

        res.json({
            success: true,
            data: {
                totalEmployees,
                presentToday,
                absentToday,
                onLeaveToday,
                lateToday,
                onTimeToday: presentToday - lateToday,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   GET /api/attendance
// @desc    Get all attendance (with filters)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { month, year, employee, department } = req.query;

        let dateQuery = {};
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            dateQuery = { date: { $gte: startDate, $lte: endDate } };
        }

        let query = { ...dateQuery };

        if (employee) {
            query.employee = employee;
        }

        const attendance = await Attendance.find(query)
            .populate('employee', 'name empId department')
            .sort({ date: -1 });

        res.json({
            success: true,
            count: attendance.length,
            data: attendance,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   GET /api/attendance/employee/:employeeId
// @desc    Get attendance for specific employee
// @access  Private (Admin or Employee for their own)
router.get('/employee/:employeeId', protectAny, async (req, res) => {
    try {
        // If employee, ensure they are requesting their own data
        if (req.userType === 'employee' && req.params.employeeId !== req.employee._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const { month, year } = req.query;

        let query = { employee: req.params.employeeId };

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await Attendance.find(query).sort({ date: -1 });

        // Calculate summary
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Determine days passed in the month (up to today)
        let daysPassed = 0;
        if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
            // For past months, use total days in that month
            daysPassed = new Date(year, month, 0).getDate();
        } else if (parseInt(year) === currentYear && parseInt(month) === currentMonth) {
            // For current month, use today's date
            daysPassed = now.getDate();
        }

        const presentCount = attendance.filter((a) => ['present', 'late', 'halfday'].includes(a.status)).length;
        const leaveCount = attendance.filter((a) => a.status === 'leave').length;
        // Note: For accurate absent count, we should subtract holidays and weekends.
        // For now, simple logic: Passed Days - (Present + Leave)
        // Ensure absent is not negative (e.g. if today is 1st and we marked attendance)
        const totalRecords = attendance.filter((a) => ['present', 'late', 'halfday', 'leave'].includes(a.status)).length;
        // Use set to count unique days if multiple records exist per day (though compound index prevents this)
        const uniqueDaysWithRecords = new Set(attendance.map(a => new Date(a.date).toISOString().split('T')[0])).size;

        const calculatedAbsent = Math.max(0, daysPassed - uniqueDaysWithRecords);

        // If there are explicit 'absent' records, include them too (though we prefer calculated)
        const explicitAbsent = attendance.filter((a) => a.status === 'absent').length;

        const summary = {
            present: presentCount,
            absent: Math.max(calculatedAbsent, explicitAbsent),
            late: attendance.filter((a) => a.status === 'late').length,
            leave: leaveCount,
            halfday: attendance.filter((a) => a.status === 'halfday').length,
        };

        res.json({
            success: true,
            count: attendance.length,
            summary,
            data: attendance,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   GET /api/attendance/monthly-summary
// @desc    Get monthly attendance summary for all employees
// @access  Private
router.get('/monthly-summary', protect, async (req, res) => {
    try {
        const { month, year } = req.query;
        const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

        const employees = await Employee.find({ status: 'active' });

        const summary = await Promise.all(
            employees.map(async (emp) => {
                const attendance = await Attendance.find({
                    employee: emp._id,
                    date: { $gte: startDate, $lte: endDate },
                });

                return {
                    employee: {
                        _id: emp._id,
                        name: emp.name,
                        empId: emp.empId,
                        department: emp.department,
                        profilePhoto: emp.profilePhoto,
                    },
                    present: attendance.filter((a) => a.status === 'present' || a.status === 'late').length,
                    absent: attendance.filter((a) => a.status === 'absent').length,
                    leave: attendance.filter((a) => a.status === 'leave').length,
                    percentage: Math.round(
                        (attendance.filter((a) => a.status === 'present' || a.status === 'late').length /
                            (endDate.getDate() - (startDate.getDay() === 0 ? 4 : 4))) * 100
                    ),
                };
            })
        );

        res.json({
            success: true,
            data: summary,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

module.exports = router;
