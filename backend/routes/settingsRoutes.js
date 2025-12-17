const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, protectAny } = require('../middleware/auth');

// @route   GET /api/settings/ip
// @desc    Get current request IP
// @access  Private
router.get('/ip', protectAny, (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    // Cleanup IP (remove ::ffff: prefix if present)
    if (ip && ip.includes('::ffff:')) {
        ip = ip.replace('::ffff:', '');
    }

    // If IP is localhost/loopback, try to get actual LAN IP
    if (ip === '::1' || ip === '127.0.0.1') {
        const { networkInterfaces } = require('os');
        const nets = networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                if (net.family === 'IPv4' && !net.internal) {
                    ip = net.address;
                    break;
                }
            }
            if (ip !== '::1' && ip !== '127.0.0.1') break;
        }
    }

    res.json({
        success: true,
        ip,
    });
});

// @route   GET /api/settings
// @desc    Get settings
// @access  Private (Admin & Employee)
router.get('/', protectAny, async (req, res) => {
    try {
        let settings = await Settings.findOne();

        // Create default settings if not exists
        if (!settings) {
            settings = await Settings.create({});
        }

        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   PUT /api/settings
// @desc    Update settings
// @access  Private
router.put('/', protect, async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create(req.body);
        } else {
            settings = await Settings.findByIdAndUpdate(
                settings._id,
                { ...req.body, updatedAt: new Date() },
                { new: true, runValidators: true }
            );
        }

        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   POST /api/settings/reset
// @desc    Reset settings to defaults
// @access  Private
router.post('/reset', protect, async (req, res) => {
    try {
        await Settings.deleteMany({});
        const settings = await Settings.create({});

        res.json({
            success: true,
            message: 'Settings reset to defaults',
            data: settings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

module.exports = router;
