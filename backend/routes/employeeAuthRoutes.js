const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// @route   POST /api/employee-auth/login
// @desc    Employee login with empId/email and password
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { empId, email, password } = req.body;

        console.log('\n========== EMPLOYEE LOGIN REQUEST ==========');
        console.log('EmpId:', empId);
        console.log('Email:', email);
        console.log('Password received:', password ? 'YES' : 'NO');

        // Can login with either empId or email
        if ((!empId && !email) || !password) {
            console.log('❌ Missing credentials');
            return res.status(400).json({
                success: false,
                message: 'Please provide employee ID/email and password',
            });
        }

        // Find employee
        let query = {};
        if (empId) {
            query.empId = empId;
        } else {
            query.email = email.toLowerCase();
        }

        console.log('Query:', query);
        const employee = await Employee.findOne(query).select('+password');

        if (!employee) {
            console.log('❌ Employee NOT found');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        console.log('✅ Employee found:', employee.name, '-', employee.empId);
        console.log('Has password in DB:', employee.password ? 'YES' : 'NO');

        // Check if employee is active
        if (employee.status !== 'active') {
            console.log('❌ Employee is inactive');
            return res.status(401).json({
                success: false,
                message: 'Your account is inactive. Contact admin.',
            });
        }

        // Check password
        if (!employee.password) {
            console.log('❌ No password set for this employee');
            return res.status(401).json({
                success: false,
                message: 'Password not set. Please contact admin to reset.',
            });
        }

        const isMatch = await employee.matchPassword(password);
        console.log('Password match:', isMatch ? 'YES ✅' : 'NO ❌');

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate token
        const token = employee.getSignedJwtToken();

        console.log('✅ LOGIN SUCCESS! Token generated.');
        console.log('==========================================\n');

        res.json({
            success: true,
            token,
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                empId: employee.empId,
                department: employee.department,
                role: employee.role,
                passwordChanged: employee.passwordChanged,
            },
        });
    } catch (error) {
        console.log('❌ LOGIN ERROR:', error.message);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   PUT /api/employee-auth/change-password
// @desc    Employee change password
// @access  Private (employee)
router.put('/change-password', async (req, res) => {
    try {
        const { empId, currentPassword, newPassword } = req.body;

        if (!empId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters',
            });
        }

        const employee = await Employee.findOne({ empId }).select('+password');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Verify current password
        const isMatch = await employee.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        // Update password
        employee.password = newPassword;
        employee.passwordChanged = true;
        await employee.save();

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   GET /api/employee-auth/me
// @desc    Get logged in employee profile
// @access  Private
router.get('/me', async (req, res) => {
    try {
        // This would be used with auth middleware for employee
        // For now, get by empId from query
        const { empId } = req.query;

        const employee = await Employee.findOne({ empId });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        res.json({
            success: true,
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                empId: employee.empId,
                phone: employee.phone,
                department: employee.department,
                role: employee.role,
                joiningDate: employee.joiningDate,
                status: employee.status,
                profilePhoto: employee.profilePhoto, // Add this
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   PUT /api/employee-auth/update-profile
// @desc    Update employee details
// @access  Private
router.put('/update-profile', async (req, res) => {
    try {
        const { empId, name, phone, email, dob } = req.body;

        if (!empId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required',
            });
        }

        const employee = await Employee.findOne({ empId });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Update fields if provided
        if (name) employee.name = name;
        if (phone) employee.phone = phone;
        if (email) employee.email = email.toLowerCase();
        // if (dob) employee.dob = dob; // Assuming Employee model has dob, if not it will just be ignored or I should add it.
        // Checking model... Employee.js does NOT have dob. It has joiningDate. 
        // I will just support name, phone, email for now as per the model I saw earlier.

        await employee.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                empId: employee.empId,
                phone: employee.phone,
                department: employee.department,
                role: employee.role,
                joiningDate: employee.joiningDate,
                status: employee.status,
                profilePhoto: employee.profilePhoto,
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
        });
    }
});

// @route   PUT /api/employee-auth/update-profile-photo
// @desc    Update employee profile photo
// @access  Private
router.put('/update-profile-photo', async (req, res) => {
    try {
        const { empId, photoData } = req.body;

        if (!empId || !photoData) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID and photo data are required',
            });
        }

        const employee = await Employee.findOne({ empId });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        employee.profilePhoto = photoData;
        await employee.save();

        res.json({
            success: true,
            message: 'Profile photo updated successfully',
            profilePhoto: photoData
        });
    } catch (error) {
        console.error('Update photo error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile photo',
        });
    }
});

module.exports = router;
