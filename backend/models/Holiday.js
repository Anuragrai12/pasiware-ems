const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Holiday name is required'],
    },
    title: {
        type: String,
    },
    date: {
        type: Date,
        required: [true, 'Holiday date is required'],
    },
    endDate: {
        type: Date,
    },
    type: {
        type: String,
        enum: ['national', 'company', 'optional', 'holiday'],
        default: 'national',
    },
    description: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Holiday', HolidaySchema);
