/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Provides middleware functions to protect routes based on user roles and permissions.
 * 
 * Security Features:
 * - Role-based route protection
 * - Permission-based access control
 * - Combined with authMiddleware for full protection
 * 
 * Usage:
 * // Protect route for Admin only
 * router.get('/admin-only', authMiddleware, requireRole('Admin'), handler);
 * 
 * // Protect route for multiple roles
 * router.get('/staff-area', authMiddleware, requireRoles(['Admin', 'Staff']), handler);
 * 
 * // Protect route by permission
 * router.post('/users', authMiddleware, requirePermission('users:create'), handler);
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { UserRole, Permission, ROLE_PERMISSIONS } from '../models/User';

/**
 * Middleware to require a specific role
 * 
 * @param role - The required role
 * @returns Express middleware function
 */
export const requireRole = (role: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
        code: 'FORBIDDEN',
        requiredRole: role,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require one of multiple roles
 * 
 * @param roles - Array of acceptable roles
 * @returns Express middleware function
 */
export const requireRoles = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const userRole = req.user.role as UserRole;
    
    if (!roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
        code: 'FORBIDDEN',
        requiredRoles: roles,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require a specific permission
 * 
 * @param permission - The required permission
 * @returns Express middleware function
 */
export const requirePermission = (permission: Permission) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const userRole = req.user.role as UserRole;
    const permissions = ROLE_PERMISSIONS[userRole] as readonly string[];
    
    if (!permissions || !permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        code: 'PERMISSION_DENIED',
        requiredPermission: permission,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require any of multiple permissions
 * 
 * @param permissions - Array of acceptable permissions (user needs at least one)
 * @returns Express middleware function
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const userRole = req.user.role as UserRole;
    const userPermissions = ROLE_PERMISSIONS[userRole] as readonly string[];
    
    const hasPermission = permissions.some(p => userPermissions?.includes(p));
    
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        code: 'PERMISSION_DENIED',
        requiredPermissions: permissions,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require all specified permissions
 * 
 * @param permissions - Array of required permissions (user needs all)
 * @returns Express middleware function
 */
export const requireAllPermissions = (permissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const userRole = req.user.role as UserRole;
    const userPermissions = ROLE_PERMISSIONS[userRole] as readonly string[];
    
    const hasAllPermissions = permissions.every(p => userPermissions?.includes(p));
    
    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        message: 'You do not have all required permissions to perform this action',
        code: 'PERMISSION_DENIED',
        requiredPermissions: permissions,
      });
      return;
    }

    next();
  };
};

/**
 * Check if user is admin
 * 
 * @param req - The authenticated request
 * @returns boolean - True if user is admin
 */
export const isAdmin = (req: AuthenticatedRequest): boolean => {
  return req.user?.role === 'Admin';
};

/**
 * Check if user can manage another user based on role hierarchy
 * 
 * Role Hierarchy:
 * Admin > Staff > Volunteer
 * 
 * - Admin can manage all users
 * - Staff can only manage Volunteers
 * - Volunteers cannot manage anyone
 * 
 * @param managerRole - The role of the user trying to manage
 * @param targetRole - The role of the user being managed
 * @returns boolean - True if manager can manage target
 */
export const canManageUser = (managerRole: UserRole, targetRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    'Admin': 3,
    'Staff': 2,
    'Volunteer': 1,
  };
  
  return roleHierarchy[managerRole] > roleHierarchy[targetRole];
};

/**
 * Middleware to prevent self-modification on certain routes
 * (e.g., prevent admin from deleting themselves)
 */
export const preventSelfAction = (action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const targetUserId = req.params.id;
    const currentUserId = req.user?.userId;
    
    if (targetUserId === currentUserId) {
      res.status(403).json({
        success: false,
        message: `You cannot ${action} your own account`,
        code: 'SELF_ACTION_FORBIDDEN',
      });
      return;
    }

    next();
  };
};

/**
 * Allowed roles for web application
 */
export const WEB_ROLES: UserRole[] = ['Admin', 'Staff'];

/**
 * Allowed roles for mobile application
 */
export const MOBILE_ROLES: UserRole[] = ['Volunteer'];

/**
 * Validate if role is allowed for web app
 */
export const isWebRole = (role: UserRole): boolean => {
  return WEB_ROLES.includes(role);
};

/**
 * Validate if role is allowed for mobile app
 */
export const isMobileRole = (role: UserRole): boolean => {
  return MOBILE_ROLES.includes(role);
};
