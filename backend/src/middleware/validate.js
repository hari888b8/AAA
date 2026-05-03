'use strict';

/**
 * Input Validation Schemas
 * Comprehensive validation for all critical API endpoints using express-validator.
 * Prevents SQL injection, XSS, and invalid data from reaching business logic.
 */

const { body, param, query: queryValidator } = require('express-validator');

// ── Reusable validators ─────────────────────────────────────────────────────

const phoneValidator = body('phone')
  .trim()
  .matches(/^[6-9]\d{9}$/)
  .withMessage('Phone must be a valid 10-digit Indian mobile number');

const uuidParam = (name) => param(name).isUUID(4).withMessage(`${name} must be a valid UUID`);

const paginationQuery = [
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  queryValidator('offset').optional().isInt({ min: 0 }).toInt(),
  queryValidator('page').optional().isInt({ min: 1 }).toInt(),
];

// ── Auth Validators ─────────────────────────────────────────────────────────

const sendOTP = [
  phoneValidator,
];

const verifyOTP = [
  phoneValidator,
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be exactly 6 digits'),
];

const register = [
  phoneValidator,
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters')
    .escape(),
  body('role')
    .isIn(['farmer', 'fpo', 'buyer', 'supplier', 'service_provider', 'admin'])
    .withMessage('Invalid role'),
  body('district_id').optional().isUUID(4),
];

// ── AgriFlow Validators ─────────────────────────────────────────────────────

const createListing = [
  body('crop_id').isUUID(4).withMessage('Valid crop_id required'),
  body('quantity_kg')
    .isFloat({ min: 1, max: 1000000 })
    .withMessage('Quantity must be 1-1,000,000 kg'),
  body('price_per_kg')
    .optional()
    .isFloat({ min: 0.01, max: 100000 })
    .withMessage('Price must be positive'),
  body('quality_grade')
    .optional()
    .isIn(['A', 'B', 'C', 'ungraded'])
    .withMessage('Grade must be A, B, C, or ungraded'),
  body('district_id').optional().isUUID(4),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .escape(),
  body('harvest_date').optional().isISO8601(),
  body('photos').optional().isArray({ max: 5 }),
];

const createInquiry = [
  body('listing_id').isUUID(4).withMessage('Valid listing_id required'),
  body('quantity_kg')
    .optional()
    .isFloat({ min: 1, max: 1000000 }),
  body('offered_price')
    .optional()
    .isFloat({ min: 0.01 }),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .escape(),
];

// ── AquaOS Validators ───────────────────────────────────────────────────────

const createPond = [
  body('pond_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape()
    .withMessage('Pond name required (max 100 chars)'),
  body('area_acres')
    .isFloat({ min: 0.01, max: 10000 })
    .withMessage('Area must be 0.01-10,000 acres'),
  body('depth_feet')
    .optional()
    .isFloat({ min: 0.5, max: 50 }),
  body('species')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .escape(),
  body('stocking_density')
    .optional()
    .isInt({ min: 1, max: 1000000 }),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
];

const logWaterQuality = [
  body('pond_id').isUUID(4).withMessage('Valid pond_id required'),
  body('dissolved_oxygen')
    .optional()
    .isFloat({ min: 0, max: 30 })
    .withMessage('DO must be 0-30 mg/L'),
  body('ph')
    .optional()
    .isFloat({ min: 0, max: 14 })
    .withMessage('pH must be 0-14'),
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 60 })
    .withMessage('Temperature must be 0-60°C'),
  body('ammonia')
    .optional()
    .isFloat({ min: 0, max: 50 }),
  body('turbidity')
    .optional()
    .isFloat({ min: 0, max: 1000 }),
];

// ── KisanConnect Validators ─────────────────────────────────────────────────

const createBooking = [
  body('equipment_id').isUUID(4).withMessage('Valid equipment_id required'),
  body('booking_date')
    .isISO8601()
    .withMessage('Valid booking date required'),
  body('duration_hours')
    .optional()
    .isInt({ min: 1, max: 720 })
    .withMessage('Duration must be 1-720 hours'),
  body('area_acres')
    .optional()
    .isFloat({ min: 0.1, max: 10000 }),
  body('location_lat').optional().isFloat({ min: -90, max: 90 }),
  body('location_lng').optional().isFloat({ min: -180, max: 180 }),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .escape(),
];

// ── FPO Validators ──────────────────────────────────────────────────────────

const createFPOProfile = [
  body('fpo_name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .escape()
    .withMessage('FPO name required (3-200 chars)'),
  body('fpo_type')
    .optional()
    .isIn(['FPO', 'FPC', 'SHG', 'Cooperative'])
    .withMessage('Invalid FPO type'),
  body('registration_number')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .escape(),
  body('district_id').optional().isUUID(4),
  body('ceo_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .escape(),
  body('whatsapp_number')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('WhatsApp number must be a valid 10-digit Indian number'),
  body('primary_crops').optional().isArray({ max: 20 }),
  body('year_established')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() }),
];

const createProcurement = [
  body('crop_id').optional().isUUID(4),
  body('quantity_kg')
    .isFloat({ min: 0.1, max: 10000000 })
    .withMessage('Quantity required (0.1 - 10,000,000 kg)'),
  body('price_per_kg')
    .isFloat({ min: 0.01, max: 100000 })
    .withMessage('Price per kg required'),
  body('quality_grade')
    .optional()
    .isIn(['A', 'B', 'C', 'ungraded']),
  body('moisture_content')
    .optional()
    .isFloat({ min: 0, max: 100 }),
  body('farmer_phone')
    .optional()
    .matches(/^[6-9]\d{9}$/),
];

// ── Trade Validators ────────────────────────────────────────────────────────

const createTradeOrder = [
  body('listing_id').isUUID(4).withMessage('Valid listing_id required'),
  body('quantity_kg')
    .isFloat({ min: 1 })
    .withMessage('Quantity must be at least 1 kg'),
  body('delivery_address')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .escape(),
  body('delivery_lat').optional().isFloat({ min: -90, max: 90 }),
  body('delivery_lng').optional().isFloat({ min: -180, max: 180 }),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .escape(),
];

// ── Payment Validators ──────────────────────────────────────────────────────

const initiatePayment = [
  body('order_id').isUUID(4).withMessage('Valid order_id required'),
  body('amount')
    .isFloat({ min: 1, max: 10000000 })
    .withMessage('Amount must be 1-10,000,000 INR'),
  body('payment_method')
    .optional()
    .isIn(['upi', 'card', 'netbanking', 'wallet'])
    .withMessage('Invalid payment method'),
];

const verifyPayment = [
  body('razorpay_order_id')
    .trim()
    .notEmpty()
    .withMessage('Razorpay order ID required'),
  body('razorpay_payment_id')
    .trim()
    .notEmpty()
    .withMessage('Razorpay payment ID required'),
  body('razorpay_signature')
    .trim()
    .notEmpty()
    .withMessage('Razorpay signature required'),
];

// ── Chat Validators ─────────────────────────────────────────────────────────

const sendMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be 1-2000 characters'),
  body('recipient_id')
    .optional()
    .isUUID(4),
  body('group_id')
    .optional()
    .isUUID(4),
  body('type')
    .optional()
    .isIn(['text', 'image', 'voice', 'location', 'document'])
    .withMessage('Invalid message type'),
];

// ── Community Validators ────────────────────────────────────────────────────

const createPost = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Post content must be 1-5000 characters'),
  body('channel')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .escape(),
  body('images').optional().isArray({ max: 5 }),
];

// ── Upload Validators ───────────────────────────────────────────────────────

const uploadImage = [
  body('image')
    .notEmpty()
    .withMessage('Image data required'),
  body('context')
    .optional()
    .isIn(['profile', 'listing', 'pond', 'crop', 'property', 'general', 'trade', 'quality', 'disease'])
    .withMessage('Invalid upload context'),
];

// ── Validation Result Handler Middleware ─────────────────────────────────────

const { validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value !== undefined ? '[REDACTED]' : undefined,
        })),
      },
    });
  }
  next();
}

module.exports = {
  // Validators
  sendOTP,
  verifyOTP,
  register,
  createListing,
  createInquiry,
  createPond,
  logWaterQuality,
  createBooking,
  createFPOProfile,
  createProcurement,
  createTradeOrder,
  initiatePayment,
  verifyPayment,
  sendMessage,
  createPost,
  uploadImage,
  // Utilities
  paginationQuery,
  uuidParam,
  handleValidationErrors,
};
