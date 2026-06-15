import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'church_event_secret_token_key_2026';

// Register a new user (always defaults to MEMBER)
export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, email, password, phone, ministryId } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique Member ID
    let memberId = '';
    let isUnique = false;
    while (!isUnique) {
      const randNum = Math.floor(10000 + Math.random() * 90000);
      memberId = `M-${randNum}`;
      const check = await prisma.user.findUnique({ where: { memberId } });
      if (!check) isUnique = true;
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        phone,
        memberId,
        role: 'MEMBER',
        ministryId: ministryId || null,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        title: 'Welcome!',
        message: `Welcome to the Church Event System, ${fullName}! Your Member ID is ${memberId}.`,
        type: 'INFO',
      },
    });

    // Sign token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName,
        ministryId: newUser.ministryId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        memberId: newUser.memberId,
        phone: newUser.phone,
        ministryId: newUser.ministryId,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

// Login user
export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        ministryId: user.ministryId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        memberId: user.memberId,
        phone: user.phone,
        ministryId: user.ministryId,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};

// Get current profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized.' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        memberId: true,
        ministryId: true,
        ministry: {
          select: { id: true, name: true },
        },
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found.' });

    return res.json({ user });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Update user role (Admin & Super Admin only)
export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and role are required.' });
    }

    // Role validation
    const validRoles = ['MEMBER', 'MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role configuration.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, fullName: true, email: true, role: true },
    });

    // Notify user of role change
    await prisma.notification.create({
      data: {
        userId,
        title: 'Role Updated',
        message: `Your account role has been updated to ${role} by an administrator. Please log out and log back in to apply changes.`,
        type: 'INFO',
      },
    });

    return res.json({
      message: `User role successfully updated to ${role}.`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Role update error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get all users (Admin/Super Admin only)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        memberId: true,
        ministryId: true,
        ministry: {
          select: { name: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    return res.json({ users });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get all ministries (Public/Members)
export const getAllMinistries = async (req: AuthRequest, res: Response) => {
  try {
    const ministries = await prisma.ministry.findMany({
      include: {
        leader: {
          select: { fullName: true, email: true },
        },
      },
    });
    return res.json({ ministries });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Update current user's profile (fullName, phone, optional password change)
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized.' });

    const { fullName, phone, currentPassword, newPassword } = req.body;

    if (!fullName) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    // Fetch current record
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Handle password change if requested
    let hashedPassword: string | undefined;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new one.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      }
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    // Perform update
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName,
        phone: phone || null,
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        memberId: true,
        ministryId: true,
      },
    });

    // Create a notification about the profile update
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Profile Updated',
        message: `Your profile has been updated successfully.${newPassword ? ' Your password has also been changed.' : ''}`,
        type: 'INFO',
      },
    });

    // Issue a fresh token with updated claims
    const token = jwt.sign(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        fullName: updatedUser.fullName,
        ministryId: updatedUser.ministryId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Profile updated successfully!',
      token,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
