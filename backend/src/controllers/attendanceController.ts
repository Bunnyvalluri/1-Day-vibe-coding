import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

// Check in via QR code payload
export const checkInQR = async (req: AuthRequest, res: Response) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({ message: 'Registration ID is required.' });
    }

    // Find the registration & check if it exists
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        user: { select: { fullName: true } },
      },
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration ticket not found.' });
    }

    if (registration.status === 'CANCELLED') {
      return res.status(400).json({ message: 'This registration has been cancelled.' });
    }

    // Verify event is active/happening
    if (registration.event.status === 'CANCELLED' || registration.event.status === 'DRAFT') {
      return res.status(400).json({ message: `Cannot check in. Event status is ${registration.event.status}.` });
    }

    // Find or create attendance slot
    let attendance = await prisma.attendance.findUnique({
      where: { registrationId },
    });

    if (!attendance) {
      attendance = await prisma.attendance.create({
        data: {
          registrationId,
          eventId: registration.eventId,
          userId: registration.userId,
          attendanceStatus: 'ABSENT',
        },
      });
    }

    // Prevent double check-in
    if (attendance.attendanceStatus === 'PRESENT' || attendance.attendanceStatus === 'LATE') {
      return res.status(400).json({
        message: `${registration.user.fullName} is already checked in. Status: ${attendance.attendanceStatus}.`,
        attendance,
      });
    }

    // Determine status: Late if check-in is after event start date
    const checkInTime = new Date();
    const eventStartTime = new Date(registration.event.startDate);
    const attendanceStatus = checkInTime > eventStartTime ? 'LATE' : 'PRESENT';

    // Update attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { registrationId },
      data: {
        checkInTime,
        attendanceStatus,
        markedById: req.user!.id,
        markedBy: req.user!.fullName,
      },
    });

    // Update registration status to ATTENDED
    await prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'ATTENDED' },
    });

    // Create a notification for the member
    await prisma.notification.create({
      data: {
        userId: registration.userId,
        title: 'Checked In Successfully',
        message: `You have checked in to "${registration.event.title}". Check-in status: ${attendanceStatus}.`,
        type: 'CHECK_IN',
      },
    });

    return res.json({
      message: 'Check-in successful!',
      userName: registration.user.fullName,
      eventTitle: registration.event.title,
      status: attendanceStatus,
      checkInTime,
      attendance: updatedAttendance,
    });
  } catch (error: any) {
    console.error('QR Check-in error:', error);
    return res.status(500).json({ message: 'Server error during QR check-in.', error: error.message });
  }
};

// Manually mark attendance (for paper lists or manual check-ins)
export const markAttendanceManual = async (req: AuthRequest, res: Response) => {
  try {
    const { registrationId, status } = req.body;

    if (!registrationId || !status) {
      return res.status(400).json({ message: 'Registration ID and attendance status are required.' });
    }

    const validStatuses = ['PRESENT', 'LATE', 'ABSENT'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid attendance status value.' });
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true, user: { select: { fullName: true } } },
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    // Find or create attendance
    const attendance = await prisma.attendance.findUnique({
      where: { registrationId },
    });

    const checkInTime = status === 'ABSENT' ? null : new Date();
    const registrationStatus = status === 'ABSENT' ? 'CONFIRMED' : 'ATTENDED';

    let updatedAttendance;
    if (attendance) {
      updatedAttendance = await prisma.attendance.update({
        where: { registrationId },
        data: {
          attendanceStatus: status,
          checkInTime,
          markedById: req.user!.id,
          markedBy: req.user!.fullName,
        },
      });
    } else {
      updatedAttendance = await prisma.attendance.create({
        data: {
          registrationId,
          eventId: registration.eventId,
          userId: registration.userId,
          attendanceStatus: status,
          checkInTime,
          markedById: req.user!.id,
          markedBy: req.user!.fullName,
        },
      });
    }

    // Sync registration status
    await prisma.registration.update({
      where: { id: registrationId },
      data: { status: registrationStatus },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: registration.userId,
        title: 'Attendance Logged',
        message: `Your attendance for "${registration.event.title}" was logged as ${status}.`,
        type: 'CHECK_IN',
      },
    });

    return res.json({
      message: `Attendance updated to ${status} for ${registration.user.fullName}.`,
      attendance: updatedAttendance,
    });
  } catch (error: any) {
    console.error('Manual attendance error:', error);
    return res.status(500).json({ message: 'Server error marking attendance.', error: error.message });
  }
};

// Get attendance listings for a specific event
export const getEventAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Ministry Leaders can only view their own ministry's events
    if (req.user!.role === 'MINISTRY_LEADER') {
      if (event.ministryId && event.ministryId !== req.user!.ministryId) {
        return res.status(403).json({ message: 'You can only view attendance for your own ministry events.' });
      }
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: { eventId },
      include: {
        user: {
          select: { fullName: true, email: true, phone: true, memberId: true },
        },
        registration: {
          select: { registrationType: true, attendeeCount: true, notes: true },
        },
      },
      orderBy: { user: { fullName: 'asc' } },
    });

    // Calculate totals
    const totalRegistered = attendanceRecords.reduce((acc, curr) => acc + curr.registration.attendeeCount, 0);
    const present = attendanceRecords.filter((r) => r.attendanceStatus === 'PRESENT').reduce((acc, curr) => acc + curr.registration.attendeeCount, 0);
    const late = attendanceRecords.filter((r) => r.attendanceStatus === 'LATE').reduce((acc, curr) => acc + curr.registration.attendeeCount, 0);
    const absent = attendanceRecords.filter((r) => r.attendanceStatus === 'ABSENT').reduce((acc, curr) => acc + curr.registration.attendeeCount, 0);

    return res.json({
      event: {
        id: event.id,
        title: event.title,
        capacity: event.capacity,
      },
      stats: {
        totalTickets: attendanceRecords.length,
        totalRegisteredHeadcount: totalRegistered,
        presentCount: present,
        lateCount: late,
        absentCount: absent,
        attendanceRate: totalRegistered > 0 ? Math.round(((present + late) / totalRegistered) * 100) : 0,
      },
      records: attendanceRecords,
    });
  } catch (error: any) {
    console.error('Fetch event attendance error:', error);
    return res.status(500).json({ message: 'Server error fetching attendance.', error: error.message });
  }
};
