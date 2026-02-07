/**
 * User Management Routes
 * 
 * CRUD operations for user management with RBAC security.
 * 
 * Security Features:
 * - Role-Based Access Control (RBAC)
 * - Password never returned in responses
 * - Password validation on creation
 * - Secure password hashing (via User model)
 * - Role hierarchy enforcement
 * 
 * Endpoints:
 * - GET    /api/users           - List all users (Admin, Staff)
 * - GET    /api/users/stats     - Get user statistics (Admin)
 * - GET    /api/users/:id       - Get user by ID (Admin, Staff)
 * - POST   /api/users           - Create user (Admin only)
 * - PUT    /api/users/:id       - Update user (Admin, limited Staff)
 * - PATCH  /api/users/:id/status - Update user status (Admin only)
 * - DELETE /api/users/:id       - Delete user (Admin only)
 */

import { Router, Response } from 'express';
import User, { UserRole, UserStatus } from '../models/User';
import { validatePassword, isCommonPassword } from '../utils/passwordValidator';
import { 
  authMiddleware, 
  AuthenticatedRequest 
} from '../middleware/authMiddleware';
import { 
  requireRoles, 
  requirePermission, 
  preventSelfAction,
  canManageUser,
  isAdmin,
  WEB_ROLES,
  MOBILE_ROLES,
} from '../middleware/rbacMiddleware';

const router = Router();

/**
 * Validation helpers
 */
const isValidRole = (role: string): role is UserRole => {
  return ['Admin', 'Staff', 'Volunteer'].includes(role);
};

const isValidStatus = (status: string): status is UserStatus => {
  return ['Active', 'Inactive', 'Suspended'].includes(status);
};

/**
 * GET /api/users/roles/available
 * 
 * Get available roles based on current user's role
 * 
 * Access: Admin, Staff
 */
router.get(
  '/roles/available',
  authMiddleware,
  requireRoles(['Admin', 'Staff']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let availableRoles: UserRole[];
      
      if (req.user?.role === 'Admin') {
        // Admin can create all roles
        availableRoles = ['Admin', 'Staff', 'Volunteer'];
      } else {
        // Staff can only create Volunteers
        availableRoles = ['Volunteer'];
      }
      
      res.json({
        success: true,
        data: {
          webRoles: WEB_ROLES,
          mobileRoles: MOBILE_ROLES,
          availableRoles,
        },
      });
    } catch (error) {
      console.error('[USER ROUTES] Error fetching roles:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
      });
    }
  }
);

/**
 * GET /api/users/stats
 * 
 * Get user statistics for dashboard
 * 
 * Access: Admin only
 */
router.get(
  '/stats',
  authMiddleware,
  requirePermission('users:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [
        totalUsers,
        adminCount,
        staffCount,
        volunteerCount,
        activeCount,
        inactiveCount,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'Admin' }),
        User.countDocuments({ role: 'Staff' }),
        User.countDocuments({ role: 'Volunteer' }),
        User.countDocuments({ status: 'Active' }),
        User.countDocuments({ status: 'Inactive' }),
      ]);
      
      res.json({
        success: true,
        data: {
          total: totalUsers,
          byRole: {
            admin: adminCount,
            staff: staffCount,
            volunteer: volunteerCount,
          },
          byStatus: {
            active: activeCount,
            inactive: inactiveCount,
          },
        },
      });
    } catch (error) {
      console.error('[USER ROUTES] Error fetching stats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
      });
    }
  }
);

/**
 * GET /api/users
 * 
 * List all users with optional filtering
 * 
 * Query params:
 * - role: Filter by role
 * - status: Filter by status
 * - search: Search by name or email
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 * 
 * Access: Admin, Staff
 * Note: Staff can only see Volunteers
 */
router.get(
  '/',
  authMiddleware,
  requireRoles(['Admin', 'Staff']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { role, status, search, page = '1', limit = '50' } = req.query;
      
      // Build query based on user role
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = {};
      
      // Staff can only see Volunteers
      if (req.user?.role === 'Staff') {
        query.role = 'Volunteer';
      } else if (role && isValidRole(role as string)) {
        query.role = role;
      }
      
      if (status && isValidStatus(status as string)) {
        query.status = status;
      }
      
      if (search) {
        const searchRegex = new RegExp(search as string, 'i');
        query.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ];
      }
      
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const skip = (pageNum - 1) * limitNum;
      
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('createdBy', 'firstName lastName'),
        User.countDocuments(query),
      ]);
      
      res.json({
        success: true,
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('[USER ROUTES] Error fetching users:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
      });
    }
  }
);

/**
 * GET /api/users/:id
 * 
 * Get user by ID
 * 
 * Access: Admin, Staff
 * Note: Staff can only view Volunteers
 */
router.get(
  '/:id',
  authMiddleware,
  requireRoles(['Admin', 'Staff']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await User.findById(req.params.id)
        .select('-password')
        .populate('createdBy', 'firstName lastName');
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found',
        });
      }
      
      // Staff can only view Volunteers
      if (req.user?.role === 'Staff' && user.role !== 'Volunteer') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this user',
          code: 'FORBIDDEN',
        });
      }
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('[USER ROUTES] Error fetching user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
      });
    }
  }
);

/**
 * POST /api/users
 * 
 * Create a new user
 * 
 * Request body:
 * - email: string (required)
 * - password: string (required)
 * - firstName: string (required)
 * - lastName: string (required)
 * - role: 'Admin' | 'Staff' | 'Volunteer' (required)
 * - barangay: string (optional)
 * - phoneNumber: string (optional)
 * - status: 'Active' | 'Inactive' (optional, default: 'Active')
 * 
 * Access: Admin only for Admin/Staff, Staff for Volunteers
 */
router.post(
  '/',
  authMiddleware,
  requirePermission('users:create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        role, 
        barangay, 
        phoneNumber,
        status = 'Active',
      } = req.body;
      
      // Validate required fields
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be provided',
          fields: ['email', 'password', 'firstName', 'lastName', 'role'],
        });
      }
      
      // Validate role
      if (!isValidRole(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be Admin, Staff, or Volunteer',
        });
      }
      
      // Staff can only create Volunteers
      if (req.user?.role === 'Staff' && role !== 'Volunteer') {
        return res.status(403).json({
          success: false,
          message: 'Staff can only create Volunteer accounts',
          code: 'FORBIDDEN',
        });
      }
      
      // Only Admin can create Admin or Staff
      if (!isAdmin(req) && (role === 'Admin' || role === 'Staff')) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can create Admin or Staff accounts',
          code: 'FORBIDDEN',
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
      
      // Validate status if provided
      if (status && !isValidStatus(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be Active, Inactive, or Suspended',
        });
      }
      
      // Validate phone number format if provided
      if (phoneNumber) {
        const phoneRegex = /^(\+63|0)?[0-9]{10,11}$/;
        if (!phoneRegex.test(phoneNumber)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid phone number format. Use Philippine format (e.g., 09123456789)',
          });
        }
      }

      // Check for existing user
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists',
        });
      }

      // Create user (password will be hashed by pre-save hook)
      const user = new User({ 
        email: email.toLowerCase(), 
        password, 
        firstName: firstName.trim(), 
        lastName: lastName.trim(),
        role,
        status,
        barangay: barangay?.trim(),
        phoneNumber: phoneNumber?.trim(),
        createdBy: req.user?.userId,
      });
      
      await user.save();

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          barangay: user.barangay,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('[USER ROUTES] Error creating user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
      });
    }
  }
);

/**
 * PUT /api/users/:id
 * 
 * Update user details
 * 
 * Access: Admin can update all, Staff can update Volunteers only
 * Note: Cannot change role to higher than own role
 */
router.put(
  '/:id',
  authMiddleware,
  requireRoles(['Admin', 'Staff']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { firstName, lastName, role, barangay, phoneNumber, status } = req.body;
      
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found',
        });
      }
      
      // Check if user can manage this target user
      const managerRole = req.user?.role as UserRole;
      
      // Staff can only manage Volunteers
      if (managerRole === 'Staff' && user.role !== 'Volunteer') {
        return res.status(403).json({
          success: false,
          message: 'You can only update Volunteer accounts',
          code: 'FORBIDDEN',
        });
      }
      
      // Validate role change
      if (role && role !== user.role) {
        if (!isValidRole(role)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role',
          });
        }
        
        // Staff cannot change roles
        if (managerRole === 'Staff') {
          return res.status(403).json({
            success: false,
            message: 'Staff cannot change user roles',
            code: 'FORBIDDEN',
          });
        }
        
        // Prevent changing to same or higher role (except Admin)
        if (!canManageUser(managerRole, role as UserRole) && managerRole !== 'Admin') {
          return res.status(403).json({
            success: false,
            message: 'Cannot assign a role equal to or higher than your own',
            code: 'FORBIDDEN',
          });
        }
        
        user.role = role;
      }
      
      // Validate status if provided
      if (status && !isValidStatus(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
        });
      }
      
      // Update allowed fields
      if (firstName) user.firstName = firstName.trim();
      if (lastName) user.lastName = lastName.trim();
      if (barangay !== undefined) user.barangay = barangay?.trim();
      if (phoneNumber !== undefined) user.phoneNumber = phoneNumber?.trim();
      if (status && isAdmin(req)) user.status = status;
      
      await user.save();

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          barangay: user.barangay,
          phoneNumber: user.phoneNumber,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error('[USER ROUTES] Error updating user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
      });
    }
  }
);

/**
 * PATCH /api/users/:id/status
 * 
 * Update user status (activate/deactivate/suspend)
 * 
 * Access: Admin only
 */
router.patch(
  '/:id/status',
  authMiddleware,
  requirePermission('users:update'),
  preventSelfAction('change status of'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status } = req.body;
      
      if (!status || !isValidStatus(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be Active, Inactive, or Suspended',
        });
      }
      
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found',
        });
      }
      
      res.json({
        success: true,
        message: `User status updated to ${status}`,
        data: user,
      });
    } catch (error) {
      console.error('[USER ROUTES] Error updating status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
      });
    }
  }
);

/**
 * PATCH /api/users/:id/password
 * 
 * Reset user password (Admin only)
 * 
 * Access: Admin only
 */
router.patch(
  '/:id/password',
  authMiddleware,
  requirePermission('users:update'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password is required',
        });
      }
      
      // Validate password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet security requirements',
          errors: passwordValidation.errors,
        });
      }
      
      if (isCommonPassword(newPassword)) {
        return res.status(400).json({
          success: false,
          message: 'This password is too common',
        });
      }
      
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found',
        });
      }
      
      // Password will be hashed by pre-save hook
      user.password = newPassword;
      await user.save();
      
      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      console.error('[USER ROUTES] Error resetting password:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
      });
    }
  }
);

/**
 * DELETE /api/users/:id
 * 
 * Delete a user
 * 
 * Access: Admin only
 * Note: Cannot delete self
 */
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('users:delete'),
  preventSelfAction('delete'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found',
        });
      }
      
      // Prevent deleting other admins (only super admin could do this in production)
      if (user.role === 'Admin' && req.user?.userId !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete another admin account',
          code: 'FORBIDDEN',
        });
      }
      
      await User.findByIdAndDelete(req.params.id);
      
      res.json({ 
        success: true, 
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('[USER ROUTES] Error deleting user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
      });
    }
  }
);

export default router;
