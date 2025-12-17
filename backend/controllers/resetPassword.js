// Quick script to reset employee password to their email
const mongoose = require('mongoose');
const Employee = require('../models/Employee');

const MONGO_URI = 'mongodb://localhost:27017/pasiware_emp';

async function resetPassword() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find employee PWT04
        const employee = await Employee.findOne({ empId: 'PWT04' });

        if (!employee) {
            console.log('❌ Employee PWT04 not found');
            process.exit(1);
        }

        console.log('Found:', employee.name, '-', employee.email);

        // Set password to email
        employee.password = employee.email; // Will be hashed by pre-save hook
        await employee.save();

        console.log('✅ Password reset to email:', employee.email);
        console.log('Now login with:');
        console.log('  EmpId:', employee.empId);
        console.log('  Password:', employee.email);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

resetPassword();
