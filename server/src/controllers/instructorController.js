import Joi from 'joi';
import bcrypt from 'bcryptjs';
import { Instructor } from '../models/Instructor.js';

// ============================================================
// INPUT VALIDATION
// ============================================================

const loginSchema = Joi.object({
  username: Joi.string().trim().min(1).required(),
  password: Joi.string().min(1).required()
}).required();

const searchSchema = Joi.object({
  name: Joi.string().trim().max(100),
  username: Joi.string().trim().max(100),
  department: Joi.string().trim().max(100),
  role: Joi.string().trim().max(50)
}).unknown(false);

// ============================================================
// PUBLIC INSTRUCTOR PROFILE
// Never expose passwords, API keys, or private contact details.
// ============================================================

function publicProfile(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    username: doc.username,
    department: doc.department,
    role: doc.role
  };
}

// ============================================================
// POST /api/instructors/login
// ============================================================

export async function loginInstructor(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: 'Invalid username or password format'
      });
    }

    const { username, password } = value;

    // Search by validated username only.
    const instructor = await Instructor.findOne({ username })
      .select('+password');

    if (!instructor) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Verify password against a stored bcrypt hash.
    const validPassword = await bcrypt.compare(
      password,
      instructor.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    return res.json({
      instructor: publicProfile(instructor)
    });

  } catch (err) {
    next(err);
  }
}

// ============================================================
// GET /api/instructors
// ============================================================

export async function getDirectory(req, res, next) {
  try {
    const instructors = await Instructor.find()
      .select('name department role')
      .sort({ name: 1 })
      .lean();

    return res.json({ instructors });

  } catch (err) {
    next(err);
  }
}

// ============================================================
// GET /api/instructors/search
// ============================================================

export async function searchInstructors(req, res, next) {
  try {
    const { error, value } = searchSchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        message: 'Invalid search parameters'
      });
    }

    // Build filter only from explicitly allowed fields.
    const filter = {};

    if (value.name) filter.name = value.name;
    if (value.username) filter.username = value.username;
    if (value.department) filter.department = value.department;
    if (value.role) filter.role = value.role;

    // Explicitly select public fields.
    const instructors = await Instructor.find(filter)
      .select('name username department role')
      .lean();

    return res.json({
      count: instructors.length,
      instructors
    });

  } catch (err) {
    next(err);
  }
}