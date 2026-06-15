import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

// Fetch notifications for the current user
export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ notifications });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Mark a single notification as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json({ notification: updated });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Mark all as read
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({ message: 'All notifications marked as read.' });
  } catch (error: any) {
    console.error('Mark all read error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Broadcast notification (Admin / Super Admin / Ministry Leader)
// Can broadcast to all, or to a specific ministry
export const broadcastNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, ministryId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required.' });
    }

    // Ministry leaders can only broadcast to their own ministry
    if (req.user!.role === 'MINISTRY_LEADER') {
      if (!ministryId || ministryId !== req.user!.ministryId) {
        return res.status(403).json({ message: 'You can only broadcast notifications to your own ministry.' });
      }
    }

    let usersToNotify: { id: string }[] = [];

    if (ministryId) {
      // Find all users in the ministry
      usersToNotify = await prisma.user.findMany({
        where: { ministryId },
        select: { id: true },
      });
    } else {
      // Find all users globally
      usersToNotify = await prisma.user.findMany({
        select: { id: true },
      });
    }

    const notificationsData = usersToNotify.map((u) => ({
      userId: u.id,
      title,
      message,
      type: 'ANNOUNCEMENT',
    }));

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({
        data: notificationsData,
      });
    }

    return res.json({
      message: `Notification broadcasted successfully to ${notificationsData.length} user(s).`,
    });
  } catch (error: any) {
    console.error('Broadcast notification error:', error);
    return res.status(500).json({ message: 'Server error broadcasting notification.', error: error.message });
  }
};
