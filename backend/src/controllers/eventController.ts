import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

// Helper to check if a user is allowed to manage an event
const canManageEvent = async (userId: string, userRole: string, userMinistryId: string | null, organizerId: string | null, eventMinistryId: string | null) => {
  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;
  if (userRole === 'MINISTRY_LEADER') {
    // Can edit if they are the organizer or if they lead the ministry associated with the event
    if (userId === organizerId) return true;
    if (userMinistryId && userMinistryId === eventMinistryId) return true;
  }
  return false;
};

// Get all events with query filters
export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const { category, status, ministryId, search, type } = req.query;

    const whereClause: any = {};

    // Filters
    if (category) whereClause.category = String(category);
    if (ministryId) whereClause.ministryId = String(ministryId);

    // Filter by search term
    if (search) {
      whereClause.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
        { venue: { contains: String(search) } },
      ];
    }

    // Filter by upcoming vs past
    if (type === 'upcoming') {
      whereClause.startDate = { gte: new Date() };
    } else if (type === 'past') {
      whereClause.startDate = { lt: new Date() };
    }

    // Role-based visibility
    // Members only see non-drafts. Ministry Leaders / Admins can see drafts.
    const userRole = req.user?.role;
    if (!userRole || userRole === 'MEMBER') {
      if (status) {
        // Members cannot request drafts
        whereClause.status = String(status) === 'DRAFT' ? 'OPEN' : String(status);
      } else {
        whereClause.status = { in: ['OPEN', 'CLOSED', 'COMPLETED', 'CANCELLED'] };
      }
    } else {
      if (status) {
        whereClause.status = String(status);
      }
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        ministry: {
          select: { name: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return res.json({ events });
  } catch (error: any) {
    console.error('Fetch events error:', error);
    return res.status(500).json({ message: 'Server error fetching events.', error: error.message });
  }
};

// Get single event by ID
export const getEventById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ministry: {
          select: { id: true, name: true },
        },
        registrations: {
          include: {
            user: {
              select: { fullName: true, email: true, phone: true, memberId: true },
            },
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // If draft, check if user has access
    if (event.status === 'DRAFT') {
      const user = req.user;
      if (!user || (user.role === 'MEMBER' && event.organizerId !== user.id)) {
        return res.status(403).json({ message: 'Access denied. Event is in draft status.' });
      }
    }

    return res.json({ event });
  } catch (error: any) {
    console.error('Fetch event details error:', error);
    return res.status(500).json({ message: 'Server error fetching event details.', error: error.message });
  }
};

// Create a new event (Ministry Leader / Admin / Super Admin)
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      venue,
      capacity,
      startDate,
      endDate,
      registrationDeadline,
      ministryId,
      status,
    } = req.body;

    if (!title || !description || !category || !venue || !capacity || !startDate || !endDate || !registrationDeadline) {
      return res.status(400).json({ message: 'Please provide all required event details.' });
    }

    const organizerId = req.user!.id;

    // A Ministry Leader can only create events for their own ministry
    if (req.user!.role === 'MINISTRY_LEADER') {
      if (!ministryId || req.user!.ministryId !== ministryId) {
        return res.status(403).json({ message: 'You can only create events under your led ministry.' });
      }
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        category,
        venue,
        capacity: Number(capacity),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: new Date(registrationDeadline),
        ministryId: ministryId || null,
        organizerId,
        status: status || 'DRAFT',
      },
    });

    return res.status(201).json({
      message: 'Event created successfully!',
      event,
    });
  } catch (error: any) {
    console.error('Create event error:', error);
    return res.status(500).json({ message: 'Server error creating event.', error: error.message });
  }
};

// Update an event
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const allowed = await canManageEvent(
      req.user!.id,
      req.user!.role,
      req.user!.ministryId,
      event.organizerId,
      event.ministryId
    );

    if (!allowed) {
      return res.status(403).json({ message: 'You do not have permission to modify this event.' });
    }

    // Prepare dates
    const formattedData = { ...updateData };
    if (updateData.capacity) formattedData.capacity = Number(updateData.capacity);
    if (updateData.startDate) formattedData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) formattedData.endDate = new Date(updateData.endDate);
    if (updateData.registrationDeadline) formattedData.registrationDeadline = new Date(updateData.registrationDeadline);

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: formattedData,
    });

    // Notify registered users if event was cancelled or details changed
    if (updateData.status === 'CANCELLED' && event.status !== 'CANCELLED') {
      const registrations = await prisma.registration.findMany({
        where: { eventId: id, status: { in: ['PENDING', 'CONFIRMED'] } },
        select: { userId: true },
      });

      const notifications = registrations.map((r) => ({
        userId: r.userId,
        title: 'Event Cancelled',
        message: `The event "${event.title}" has been cancelled. We apologize for any inconvenience.`,
        type: 'CANCELLATION',
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    }

    return res.json({
      message: 'Event updated successfully!',
      event: updatedEvent,
    });
  } catch (error: any) {
    console.error('Update event error:', error);
    return res.status(500).json({ message: 'Server error updating event.', error: error.message });
  }
};

// Delete an event
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const allowed = await canManageEvent(
      req.user!.id,
      req.user!.role,
      req.user!.ministryId,
      event.organizerId,
      event.ministryId
    );

    if (!allowed) {
      return res.status(403).json({ message: 'You do not have permission to delete this event.' });
    }

    await prisma.event.delete({ where: { id } });

    return res.json({ message: 'Event deleted successfully.' });
  } catch (error: any) {
    console.error('Delete event error:', error);
    return res.status(500).json({ message: 'Server error deleting event.', error: error.message });
  }
};
