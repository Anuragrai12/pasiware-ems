// List all employees
const mongoose = require('mongoose');
const Employee = require('../models/Employee');

const MONGO_URI = 'mongodb://localhost:27017/pasiware_emp';

async function listEmployees() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const employees = await Employee.find({}, 'empId name email status');

        if (employees.length === 0) {
            console.log('❌ No employees in database');
        } else {
            console.log('\n📋 Employees in database:');
            employees.forEach(emp => {
                console.log(`  - ${emp.empId}: ${emp.name} (${emp.email}) [${emp.status}]`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

listEmployees();
