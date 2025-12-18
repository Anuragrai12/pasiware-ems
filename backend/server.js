require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware - CORS Configuration
app.use(cors({
    origin: '*', // Allow all origins (can restrict later)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Increased for face photos

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employee-auth', require('./routes/employeeAuthRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/face', require('./routes/faceRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Pasiware EMP API is running' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error',
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} and accessible on network`);
});
