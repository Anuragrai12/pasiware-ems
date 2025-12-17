const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const EmployeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Employee name is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
    },
    empId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
    },
    phone: {
        type: String,
    },
    department: {
        type: String,
        enum: ['Development', 'HR', 'Support', 'Marketing', 'Finance', 'Other'],
        default: 'Other',
    },
    role: {
        type: String,
        default: 'Employee',
    },
    joiningDate: {
        type: Date,
        default: Date.now,
    },
    salary: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    // For employee app login - default password is email
    password: {
        type: String,
        select: false,
    },
    // Track if employee changed default password
    passwordChanged: {
        type: Boolean,
        default: false,
    },
    // Face recognition fields
    faceRegistered: {
        type: Boolean,
        default: false,
    },
    profilePhoto: {
        type: String, // Base64 of profile picture
        default: null
    },
    facePhotoData: {
        type: String, // Base64 encoded photo (for backup/display)
    },
    faceEmbedding: {
        type: [Number], // 128-dimension face embedding vector
        default: null,
    },
    faceRegisteredAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
EmployeeSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Match password
EmployeeSchema.methods.matchPassword = async function (enteredPassword) {
    // Handle case where password is not set
    if (!this.password) {
        return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT for employee
EmployeeSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, type: 'employee' }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// Generate initials from name
EmployeeSchema.virtual('initials').get(function () {
    return this.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
});

module.exports = mongoose.model('Employee', EmployeeSchema);
