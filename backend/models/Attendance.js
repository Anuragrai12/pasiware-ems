const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    checkIn: {
        type: Date,
    },
    checkOut: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'halfday', 'leave', 'holiday'],
        default: 'absent',
    },
    // Location data from app
    checkInLocation: {
        latitude: Number,
        longitude: Number,
    },
    checkOutLocation: {
        latitude: Number,
        longitude: Number,
    },
    notes: String,
    workHours: {
        type: Number,
        default: 0,
    },
    markedBy: {
        type: String,
        enum: ['app', 'admin'],
        default: 'app',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index for employee + date uniqueness
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
