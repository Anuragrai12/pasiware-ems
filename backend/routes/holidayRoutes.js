const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');
const { protect } = require('../middleware/auth');

// @route   GET /api/holidays
// @desc    Get all holidays
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { year, month } = req.query;

        let query = {};
        if (year) {
            const startDate = new Date(year, month ? month - 1 : 0, 1);
            const endDate = new Date(year, month ? month : 12, 0);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const holidays = await Holiday.find(query).sort({ date: 1 });

        res.json({
            success: true,
            count: holidays.length,
            data: holidays,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   GET /api/holidays/:id
// @desc    Get single holiday
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const holiday = await Holiday.findById(req.params.id);

        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found',
            });
        }

        res.json({
            success: true,
            data: holiday,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   POST /api/holidays
// @desc    Create holiday
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const holiday = await Holiday.create(req.body);

        res.status(201).json({
            success: true,
            data: holiday,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   PUT /api/holidays/:id
// @desc    Update holiday
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const holiday = await Holiday.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found',
            });
        }

        res.json({
            success: true,
            data: holiday,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @route   DELETE /api/holidays/:id
// @desc    Delete holiday
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const holiday = await Holiday.findByIdAndDelete(req.params.id);

        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found',
            });
        }

        res.json({
            success: true,
            message: 'Holiday deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

module.exports = router;
