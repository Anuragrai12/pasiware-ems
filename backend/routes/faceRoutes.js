const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');

/**
 * Validate Request IP against configured Office IP
 * Supports exact match and local subnet match (e.g., 192.168.1.x)
 */
const validateIP = async (req) => {
    try {
        const settings = await Settings.findOne();
        if (!settings || !settings.officeIP || settings.officeIP.trim() === '') {
            return { valid: true }; // No IP restriction configured
        }

        const allowedIP = settings.officeIP.trim();
        let requestIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

        // Cleanup Request IP
        if (requestIP && requestIP.includes('::ffff:')) {
            requestIP = requestIP.replace('::ffff:', '');
        }

        // 1. Exact Match
        if (requestIP === allowedIP) {
            return { valid: true };
        }

        // 2. Local Subnet Match (User Hint: "ip address change hota hai")
        // If both are 192.168.x.x, allow if first 3 parts match
        if (allowedIP.startsWith('192.168.') && requestIP.startsWith('192.168.')) {
            const allowedParts = allowedIP.split('.');
            const requestParts = requestIP.split('.');
            if (allowedParts[0] === requestParts[0] &&
                allowedParts[1] === requestParts[1] &&
                allowedParts[2] === requestParts[2]) {
                return { valid: true };
            }
        }

        return {
            valid: false,
            message: `IP Mismatch. Allowed Network: ${allowedIP}, You are on: ${requestIP}`
        };

    } catch (error) {
        console.error('IP Validation Error:', error);
        return { valid: true }; // Fail open if DB error to avoid blocking attendance
    }
};

// ============================================
// Python Face Service Configuration
// ============================================
const PYTHON_FACE_SERVICE_URL = process.env.PYTHON_FACE_SERVICE_URL || 'http://localhost:5001';

/**
 * Call Python face recognition service
 * @param {string} endpoint - API endpoint (e.g., '/register', '/verify')
 * @param {object} data - Request body
 * @returns {Promise<object>} - Response from Python service
 */
const callPythonService = async (endpoint, data) => {
    try {
        const response = await fetch(`${PYTHON_FACE_SERVICE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        console.error(`Python service error (${endpoint}):`, error.message);
        return { success: false, error: error.message, pythonServiceDown: true };
    }
};

/**
 * Check if Python service is available
 */
const checkPythonService = async () => {
    try {
        const response = await fetch(`${PYTHON_FACE_SERVICE_URL}/health`);
        const data = await response.json();
        return data.status === 'ok';
    } catch {
        return false;
    }
};

// ============================================
// Face Comparison Helper Functions
// ============================================

/**
 * Extract basic features from base64 image for comparison
 * @param {string} base64Data - Base64 encoded image data
 * @returns {number[]} - Feature vector (128 dimensions)
 */
const extractFeatures = (base64Data) => {
    const features = [];
    const dataLength = base64Data.length;
    const sampleSize = 128;
    const step = Math.floor(dataLength / sampleSize);

    for (let i = 0; i < sampleSize; i++) {
        const idx = i * step;
        if (idx < dataLength) {
            features.push(base64Data.charCodeAt(idx) % 256);
        } else {
            features.push(0);
        }
    }

    // Normalize features
    const max = Math.max(...features);
    const min = Math.min(...features);
    const range = max - min || 1;

    return features.map(f => (f - min) / range);
};

/**
 * Calculate cosine similarity between two feature vectors
 * @param {number[]} vec1 - First feature vector
 * @param {number[]} vec2 - Second feature vector
 * @returns {number} - Similarity score (0 to 1)
 */
const cosineSimilarity = (vec1, vec2) => {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
};

/**
 * Compare two face photos for similarity
 * @param {string} storedPhoto - Stored face photo (base64)
 * @param {string} capturedPhoto - Captured face photo (base64)
 * @returns {{match: boolean, similarity: number}}
 */
const compareFacePhotos = (storedPhoto, capturedPhoto) => {
    const MATCH_THRESHOLD = 0.6; // 60% similarity required for match

    try {
        const storedFeatures = extractFeatures(storedPhoto);
        const capturedFeatures = extractFeatures(capturedPhoto);

        const similarity = cosineSimilarity(storedFeatures, capturedFeatures);
        const match = similarity >= MATCH_THRESHOLD;

        return { match, similarity };
    } catch (error) {
        console.error('Face comparison error:', error);
        return { match: false, similarity: 0 };
    }
};

// ============================================
// API Routes
// ============================================

// @route   GET /api/face/status/:empId
// @desc    Check if employee has registered face
// @access  Private
router.get('/status/:empId', async (req, res) => {
    try {
        const { empId } = req.params;

        const employee = await Employee.findOne({ empId });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        res.json({
            success: true,
            faceRegistered: employee.faceRegistered || false,
            faceRegisteredAt: employee.faceRegisteredAt,
        });
    } catch (error) {
        console.error('Face status error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   POST /api/face/register
// @desc    Register employee face photo
// @access  Private
router.post('/register', async (req, res) => {
    try {
        const { empId, facePhotoData } = req.body;

        console.log('\n========== FACE REGISTRATION ==========');
        console.log('EmpId:', empId);
        console.log('Photo data received:', facePhotoData ? 'YES' : 'NO');

        if (!empId || !facePhotoData) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID and face photo are required',
            });
        }

        const employee = await Employee.findOne({ empId });

        if (!employee) {
            console.log('❌ Employee not found');
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Try to register with Python service (for accurate face encoding)
        const pythonAvailable = await checkPythonService();
        let pythonResult = null;

        if (pythonAvailable) {
            console.log('🐍 Python service available, registering face encoding...');
            pythonResult = await callPythonService('/register', {
                emp_id: empId,
                image: facePhotoData,
            });
            console.log('🐍 Python result:', pythonResult.success ? 'SUCCESS' : 'FAILED');
        } else {
            console.log('⚠️ Python service not available, using fallback');
        }

        // Save face photo data to MongoDB (as backup)
        employee.facePhotoData = facePhotoData;
        employee.faceRegistered = true;
        employee.faceRegisteredAt = new Date();
        await employee.save();

        console.log('✅ Face registered successfully for', employee.name);
        console.log('==========================================\n');

        res.json({
            success: true,
            message: 'Face registered successfully',
            faceRegisteredAt: employee.faceRegisteredAt,
            pythonService: pythonAvailable,
            pythonResult: pythonResult,
        });
    } catch (error) {
        console.error('Face registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   POST /api/face/check-in
// @desc    Check-in using face recognition
// @access  Private
router.post('/check-in', async (req, res) => {
    try {
        const { empId, facePhotoData, location } = req.body;

        console.log('\n========== FACE CHECK-IN ==========');
        console.log('EmpId:', empId);
        console.log('Location:', location);

        // 1. Validate IP
        const ipCheck = await validateIP(req);
        if (!ipCheck.valid) {
            console.log('❌ IP Validation Failed:', ipCheck.message);
            return res.status(403).json({
                success: false,
                message: `Attendance rejected. ${ipCheck.message}. Please connect to Office WiFi.`,
            });
        }

        if (!empId || !facePhotoData) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID and face photo are required',
            });
        }

        const employee = await Employee.findOne({ empId });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        if (!employee.faceRegistered) {
            return res.status(400).json({
                success: false,
                message: 'Face not registered. Please register first.',
            });
        }

        // Try Python service first (accurate face matching)
        const pythonAvailable = await checkPythonService();
        let matchResult;

        if (pythonAvailable) {
            console.log('🐍 Using Python service for face verification...');
            const pythonResult = await callPythonService('/verify', {
                emp_id: empId,
                image: facePhotoData,
            });

            if (pythonResult.pythonServiceDown) {
                // Fallback to local comparison
                console.log('⚠️ Python service failed, using fallback');
                matchResult = compareFacePhotos(employee.facePhotoData, facePhotoData);
            } else {
                matchResult = {
                    match: pythonResult.match,
                    similarity: (pythonResult.confidence || 0) / 100,
                    confidence: pythonResult.confidence,
                    distance: pythonResult.distance,
                    pythonService: true,
                };
            }
            console.log('🐍 Python result:', pythonResult);
        } else {
            // Fallback to local comparison
            console.log('⚠️ Python service not available, using local comparison');
            if (!employee.facePhotoData) {
                return res.status(400).json({
                    success: false,
                    message: 'Face data not found. Please re-register.',
                });
            }
            matchResult = compareFacePhotos(employee.facePhotoData, facePhotoData);
        }

        console.log('Face match result:', matchResult);

        if (!matchResult.match) {
            const similarity = matchResult.pythonService
                ? `Confidence: ${matchResult.confidence?.toFixed(1)}%`
                : `Similarity: ${(matchResult.similarity * 100).toFixed(1)}%`;
            return res.status(401).json({
                success: false,
                message: `Face does not match. ${similarity}. Please try again.`,
                similarity: matchResult.similarity,
                confidence: matchResult.confidence,
                pythonService: pythonAvailable,
            });
        }

        console.log(`Face match: YES ✅ (${matchResult.pythonService ? 'Python' : 'Local'})`);


        // Check if already checked in today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let attendance = await Attendance.findOne({
            employee: employee._id,
            date: { $gte: today, $lt: tomorrow },
        });

        if (attendance && attendance.checkIn) {
            return res.status(400).json({
                success: false,
                message: 'Already checked in today',
                checkInTime: attendance.checkIn,
            });
        }

        // Create new attendance record
        const now = new Date();

        // Calculate Late Status dynamically from Settings
        let isLate = false;
        const settings = await Settings.findOne();
        if (settings && settings.officeStartTime) {
            const [startHour, startMinute] = settings.officeStartTime.split(':').map(Number);
            const graceMinutes = settings.lateGraceMinutes || 0;

            const expectedTime = new Date(now);
            expectedTime.setHours(startHour, startMinute + graceMinutes, 0, 0);

            if (now > expectedTime) {
                isLate = true;
            }
        } else {
            // Fallback if no settings found (default 10:00 AM)
            const checkInHour = now.getHours();
            isLate = checkInHour >= 10;
        }

        if (!attendance) {
            attendance = new Attendance({
                employee: employee._id,
                date: today,
                checkIn: now,
                status: isLate ? 'late' : 'present',
                location: location,
            });
        } else {
            attendance.checkIn = now;
            attendance.status = isLate ? 'late' : 'present';
        }

        await attendance.save();

        console.log('✅ Check-in successful at', now.toLocaleTimeString());
        console.log('Status:', isLate ? 'LATE' : 'ON TIME');
        console.log('======================================\n');

        res.json({
            success: true,
            message: isLate ? 'Checked in (Late)' : 'Checked in successfully',
            data: {
                checkIn: attendance.checkIn,
                status: attendance.status,
                isLate,
            },
        });
    } catch (error) {
        console.error('Face check-in error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   POST /api/face/check-out
// @desc    Check-out using face recognition
// @access  Private
router.post('/check-out', async (req, res) => {
    try {
        const { empId, facePhotoData, location } = req.body;

        console.log('\n========== FACE CHECK-OUT ==========');
        console.log('EmpId:', empId);

        // 1. Validate IP
        const ipCheck = await validateIP(req);
        if (!ipCheck.valid) {
            console.log('❌ IP Validation Failed:', ipCheck.message);
            return res.status(403).json({
                success: false,
                message: `Check-out rejected. ${ipCheck.message}. Please connect to Office WiFi.`,
            });
        }

        if (!empId || !facePhotoData) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID and face photo are required',
            });
        }

        const employee = await Employee.findOne({ empId });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        if (!employee.faceRegistered) {
            return res.status(400).json({
                success: false,
                message: 'Face not registered. Please register first.',
            });
        }

        // Try Python service first (accurate face matching)
        const pythonAvailable = await checkPythonService();
        let matchResult;

        if (pythonAvailable) {
            console.log('🐍 Using Python service for face verification...');
            const pythonResult = await callPythonService('/verify', {
                emp_id: empId,
                image: facePhotoData,
            });

            if (pythonResult.pythonServiceDown) {
                console.log('⚠️ Python service failed, using fallback');
                matchResult = compareFacePhotos(employee.facePhotoData, facePhotoData);
            } else {
                matchResult = {
                    match: pythonResult.match,
                    similarity: (pythonResult.confidence || 0) / 100,
                    confidence: pythonResult.confidence,
                    distance: pythonResult.distance,
                    pythonService: true,
                };
            }
        } else {
            console.log('⚠️ Python service not available, using local comparison');
            if (!employee.facePhotoData) {
                return res.status(400).json({
                    success: false,
                    message: 'Face data not found. Please re-register.',
                });
            }
            matchResult = compareFacePhotos(employee.facePhotoData, facePhotoData);
        }

        console.log('Face match result:', matchResult);

        if (!matchResult.match) {
            return res.status(401).json({
                success: false,
                message: `Face does not match. Please try again.`,
                similarity: matchResult.similarity,
                pythonService: pythonAvailable,
            });
        }

        console.log(`Face match: YES ✅ (${matchResult.pythonService ? 'Python' : 'Local'})`);


        // Find today's attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendance = await Attendance.findOne({
            employee: employee._id,
            date: { $gte: today, $lt: tomorrow },
        });

        if (!attendance || !attendance.checkIn) {
            return res.status(400).json({
                success: false,
                message: 'No check-in found for today. Please check-in first.',
            });
        }

        if (attendance.checkOut) {
            return res.status(400).json({
                success: false,
                message: 'Already checked out today',
                checkOutTime: attendance.checkOut,
            });
        }

        // Update checkout
        const now = new Date();
        attendance.checkOut = now;

        // Calculate work hours
        const workMs = now - attendance.checkIn;
        const workHours = Math.round((workMs / (1000 * 60 * 60)) * 100) / 100;
        attendance.workHours = workHours;

        await attendance.save();

        console.log('✅ Check-out successful at', now.toLocaleTimeString());
        console.log('Work hours:', workHours);
        console.log('======================================\n');

        res.json({
            success: true,
            message: 'Checked out successfully',
            data: {
                checkIn: attendance.checkIn,
                checkOut: attendance.checkOut,
                workHours,
            },
        });
    } catch (error) {
        console.error('Face check-out error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

module.exports = router;
