/**
 * User Management Routes
 * 
 * CRUD operations for user management with security measures.
 * 
 * Security Features:
 * - Password never returned in responses
 * - Password validation on creation
 * - Secure password hashing (via User model)
 * 
 * Note: These routes should be protected by authMiddleware
 * in production to prevent unauthorized access.
 */

import { Router, Request, Response } from 'express';
import User from '../models/User';
import { validatePassword, isCommonPassword } from '../utils/passwordValidator';

const router = Router();

// Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create user
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }
    
    // Validate password against security policy
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }
    
    // Check for common weak passwords
    if (isCommonPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'This password is too common. Please choose a stronger password.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Password will be automatically hashed by User model pre-save hook
    const user = new User({ 
      email: email.toLowerCase(), 
      password, 
      firstName: firstName.trim(), 
      lastName: lastName.trim(),
    });
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
