const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    // Organization
    companyName: {
        type: String,
        default: 'Pasiware Technologies Private Limited',
    },
    shortName: {
        type: String,
        default: 'Pasiware',
    },
    timeZone: {
        type: String,
        default: 'Asia/Kolkata',
    },
    workDays: {
        type: [String],
        default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },

    // Attendance Rules
    officeStartTime: {
        type: String,
        default: '09:30',
    },
    officeEndTime: {
        type: String,
        default: '18:30',
    },
    lateGraceMinutes: {
        type: Number,
        default: 15,
    },
    halfDayAfter: {
        type: String,
        default: '12:00',
    },
    markAbsentBy: {
        type: String,
        default: '14:00',
    },
    autoApproveHolidayLeaves: {
        type: Boolean,
        default: false,
    },
    officeIP: {
        type: String,
        default: '',
    },

    // Leave Rules
    monthlyCasualLeaveLimit: {
        type: Number,
        default: 1, // Default 1 casual leave per month
    },
    maxLeavesPerMonth: {
        type: Number,
        default: 2, // Total max leaves allowed per month
    },
    minLeaveNoticeDays: {
        type: Number,
        default: 0, // 0 means can apply for same day (if logic allows) or next day
    },

    // Salary & Payroll Settings
    salaryCurrency: {
        type: String,
        default: '₹',
    },
    salaryPaymentDate: {
        type: Number,
        default: 1, // 1st of every month
        min: 1,
        max: 31,
    },
    payPeriodStartDate: {
        type: Number,
        default: 1,
        min: 1,
        max: 31,
    },

    // Salary Structure
    basicSalaryPercent: {
        type: Number,
        default: 40, // 40% of CTC is Basic
        min: 0,
        max: 100,
    },
    hraPercent: {
        type: Number,
        default: 50, // 50% of Basic
        min: 0,
        max: 100,
    },
    conveyanceAllowance: {
        type: Number,
        default: 0,
    },
    medicalAllowance: {
        type: Number,
        default: 0,
    },

    // Overtime & Attendance-based Pay
    overtimeEnabled: {
        type: Boolean,
        default: false,
    },
    overtimeRate: {
        type: Number,
        default: 1.5, // 1.5x hourly rate
    },
    lopEnabled: {
        type: Boolean,
        default: true, // Loss of Pay for absents
    },

    // Deductions
    pfDeductionPercent: {
        type: Number,
        default: 12, // 12% of Basic
        min: 0,
        max: 100,
    },
    esiDeductionPercent: {
        type: Number,
        default: 0.75, // 0.75%
        min: 0,
        max: 100,
    },
    professionalTax: {
        type: Number,
        default: 0, // Flat amount per month
    },
    tdsPercent: {
        type: Number,
        default: 0, // % of gross salary
        min: 0,
        max: 100,
    },

    // Advance Salary
    allowAdvance: {
        type: Boolean,
        default: false,
    },
    maxAdvancePercent: {
        type: Number,
        default: 50, // Max 50% of monthly salary
        min: 0,
        max: 100,
    },
    advanceDeductionMonths: {
        type: Number,
        default: 3, // Deduct over 3 months
        min: 1,
        max: 12,
    },

    // Bonuses
    performanceBonusEnabled: {
        type: Boolean,
        default: false,
    },
    festivalBonus: {
        type: Number,
        default: 0, // Fixed amount
    },
    attendanceBonus: {
        type: Number,
        default: 0, // Bonus for 100% attendance
    },

    // Notifications (Admin Preferences)
    notifyLeave: {
        type: Boolean,
        default: false,
    },
    notifyAttendance: {
        type: Boolean,
        default: false,
    },

    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Settings', SettingsSchema);
