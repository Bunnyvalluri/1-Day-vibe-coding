import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import * as QRCode from 'qrcode';

// Register for an event
export const registerForEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, registrationType, attendeeCount, notes } = req.body;
    const userId = req.user!.id;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required.' });
    }

    // 1. Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: { status: { in: ['PENDING', 'CONFIRMED', 'ATTENDED'] } },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // 2. Validate event status
    if (event.status !== 'OPEN') {
      return res.status(400).json({ message: `Registration is not open. Event status is ${event.status}.` });
    }

    // 3. Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed for this event.' });
    }

    // 4. Prevent duplicate registration
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId,
        userId,
        status: { in: ['PENDING', 'CONFIRMED', 'ATTENDED'] },
      },
    });

    if (existingRegistration) {
      return res.status(400).json({
        message: 'You are already registered for this event.',
        registrationId: existingRegistration.id,
      });
    }

    // 5. Check capacity
    const count = Number(attendeeCount) || 1;
    const currentRegistered = event.registrations.reduce((acc, curr) => acc + curr.attendeeCount, 0);
    if (currentRegistered + count > event.capacity) {
      return res.status(400).json({
        message: `Sorry, not enough seats. Available spots: ${event.capacity - currentRegistered}.`,
      });
    }

    // 6. Create registration
    const registration = await prisma.registration.create({
      data: {
        eventId,
        userId,
        registrationType: registrationType || 'INDIVIDUAL',
        attendeeCount: count,
        notes: notes || null,
        status: 'CONFIRMED', // Defaulting to confirmed for simple flow
      },
    });

    // 7. Auto-create an empty attendance slot for scanning later
    await prisma.attendance.create({
      data: {
        registrationId: registration.id,
        eventId,
        userId,
        attendanceStatus: 'ABSENT',
      },
    });

    // 8. Send in-app notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Registration Confirmed',
        message: `You have successfully registered for "${event.title}". Spot(s) reserved: ${count}.`,
        type: 'INFO',
      },
    });

    return res.status(201).json({
      message: 'Event registered successfully!',
      registration,
    });
  } catch (error: any) {
    console.error('Event registration error:', error);
    return res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

// Get registrations for the logged-in user
export const getMyRegistrations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const registrations = await prisma.registration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            venue: true,
            category: true,
            status: true,
          },
        },
        attendance: {
          select: {
            checkInTime: true,
            attendanceStatus: true,
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    return res.json({ registrations });
  } catch (error: any) {
    console.error('Fetch my registrations error:', error);
    return res.status(500).json({ message: 'Server error fetching registrations.', error: error.message });
  }
};

// Cancel a registration
export const cancelRegistration = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    // Authorization check: Only owner of registration or Admin/Super Admin can cancel
    if (registration.userId !== userId && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'You do not have permission to cancel this registration.' });
    }

    if (registration.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Registration is already cancelled.' });
    }

    // Cannot cancel if event already happened
    if (new Date() > new Date(registration.event.endDate)) {
      return res.status(400).json({ message: 'Cannot cancel registration for a past event.' });
    }

    // Update status to CANCELLED
    const updatedReg = await prisma.registration.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Remove the associated attendance slot
    await prisma.attendance.deleteMany({
      where: { registrationId: id },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: registration.userId,
        title: 'Registration Cancelled',
        message: `Your registration for "${registration.event.title}" has been cancelled.`,
        type: 'INFO',
      },
    });

    return res.json({
      message: 'Registration cancelled successfully.',
      registration: updatedReg,
    });
  } catch (error: any) {
    console.error('Cancel registration error:', error);
    return res.status(500).json({ message: 'Server error cancelling registration.', error: error.message });
  }
};

// Generate QR Code image data URL for a registration ID
export const getRegistrationQR = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, email: true, memberId: true } },
        event: { select: { title: true, startDate: true } },
      },
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    // Verify ownership or staff permissions
    if (
      registration.userId !== req.user!.id &&
      !['MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Create payload for scanning
    const payload = JSON.stringify({
      registrationId: registration.id,
      userId: registration.userId,
      eventId: registration.eventId,
      memberName: registration.user.fullName,
      memberId: registration.user.memberId,
      eventTitle: registration.event.title,
    });

    // Generate QR Code data URL
    const qrCodeUrl = await QRCode.toDataURL(payload);

    return res.json({ qrCodeUrl });
  } catch (error: any) {
    console.error('QR code generation error:', error);
    return res.status(500).json({ message: 'Server error generating QR code.', error: error.message });
  }
};
