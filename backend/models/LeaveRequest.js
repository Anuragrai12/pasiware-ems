const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    type: {
        type: String,
        enum: ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Other'],
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
    reviewedAt: Date,
    rejectionReason: String,
    appliedAt: {
        type: Date,
        default: Date.now,
    },
});

// Calculate number of days
LeaveRequestSchema.virtual('days').get(function () {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end date
});

// Ensure virtuals are included in JSON
LeaveRequestSchema.set('toJSON', { virtuals: true });
LeaveRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
