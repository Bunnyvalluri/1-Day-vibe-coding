import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import { stringify } from 'csv-stringify';
import PDFDocument from 'pdfkit';

// Get high-level stats for the admin dashboard
export const getAdminDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalEvents = await prisma.event.count();
    const totalRegistrations = await prisma.registration.count({
      where: { status: { in: ['CONFIRMED', 'ATTENDED'] } },
    });

    // Calculate attendance percentage
    const attendanceRecords = await prisma.attendance.findMany();
    const totalAttendanceSlots = attendanceRecords.length;
    const checkedInCount = attendanceRecords.filter((a) => a.attendanceStatus === 'PRESENT' || a.attendanceStatus === 'LATE').length;
    const attendancePercentage = totalAttendanceSlots > 0 ? Math.round((checkedInCount / totalAttendanceSlots) * 100) : 0;

    // Ministries breakdown
    const ministries = await prisma.ministry.findMany({
      include: {
        _count: { select: { events: true, members: true } },
      },
    });

    const ministryStats = ministries.map((m) => ({
      id: m.id,
      name: m.name,
      eventsCount: m._count.events,
      membersCount: m._count.members,
      status: m.status,
    }));

    // Category distribution
    const events = await prisma.event.findMany({ select: { category: true } });
    const categoryCounts: { [key: string]: number } = {};
    events.forEach((e) => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });
    const categoryStats = Object.keys(categoryCounts).map((cat) => ({
      category: cat,
      count: categoryCounts[cat],
    }));

    // Recent activity (Last 5 registrations)
    const recentRegistrations = await prisma.registration.findMany({
      take: 5,
      orderBy: { registeredAt: 'desc' },
      include: {
        user: { select: { fullName: true } },
        event: { select: { title: true } },
      },
    });

    const activities = recentRegistrations.map((r) => ({
      id: r.id,
      user: r.user.fullName,
      event: r.event.title,
      date: r.registeredAt,
      status: r.status,
    }));

    return res.json({
      stats: {
        totalUsers,
        totalEvents,
        totalRegistrations,
        attendancePercentage,
      },
      ministryStats,
      categoryStats,
      recentActivity: activities,
    });
  } catch (error: any) {
    console.error('Fetch dashboard stats error:', error);
    return res.status(500).json({ message: 'Server error loading stats.', error: error.message });
  }
};

// Export event attendance to CSV
export const exportEventAttendanceCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const records = await prisma.attendance.findMany({
      where: { eventId },
      include: {
        user: { select: { fullName: true, email: true, memberId: true } },
        registration: { select: { registrationType: true, attendeeCount: true } },
      },
    });

    const csvData = records.map((r) => ({
      'Member ID': r.user.memberId || 'N/A',
      'Full Name': r.user.fullName,
      'Email': r.user.email,
      'Registration Type': r.registration.registrationType,
      'Attendees Count': r.registration.attendeeCount,
      'Status': r.attendanceStatus,
      'Check-in Time': r.checkInTime ? r.checkInTime.toISOString() : 'N/A',
      'Marked By': r.markedBy || 'N/A',
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${event.title.replace(/\s+/g, '_')}.csv"`);

    stringify(csvData, { header: true }, (err, output) => {
      if (err) throw err;
      res.send(output);
    });
  } catch (error: any) {
    console.error('CSV export error:', error);
    return res.status(500).json({ message: 'Server error generating CSV.', error: error.message });
  }
};

// Export event attendance to PDF
export const exportEventAttendancePDF = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ministry: true },
    });
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const records = await prisma.attendance.findMany({
      where: { eventId },
      include: {
        user: { select: { fullName: true, email: true, memberId: true } },
        registration: { select: { registrationType: true, attendeeCount: true } },
      },
      orderBy: { user: { fullName: 'asc' } },
    });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${event.title.replace(/\s+/g, '_')}.pdf"`);

    doc.pipe(res);

    // PDF Header
    doc.fontSize(20).text('Church Event Attendance Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Event: ${event.title}`, { align: 'left' });
    doc.fontSize(10).text(`Ministry: ${event.ministry?.name || 'General'}`, { align: 'left' });
    doc.text(`Date: ${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`, { align: 'left' });
    doc.text(`Venue: ${event.venue}`, { align: 'left' });
    doc.moveDown();

    // Stats box
    const totalTickets = records.length;
    const present = records.filter((r) => r.attendanceStatus === 'PRESENT' || r.attendanceStatus === 'LATE').length;
    const absent = records.filter((r) => r.attendanceStatus === 'ABSENT').length;
    doc.fontSize(11).text(`Total Registrations: ${totalTickets}  |  Checked In: ${present}  |  Absent: ${absent}`, {
      align: 'center',
    });
    doc.moveDown();

    // Table Header
    const tableTop = 200;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Member ID', 50, tableTop);
    doc.text('Name', 130, tableTop);
    doc.text('Type', 280, tableTop);
    doc.text('Size', 340, tableTop);
    doc.text('Status', 390, tableTop);
    doc.text('Check-in Time', 450, tableTop);

    // Draw horizontal line below header
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table rows
    let y = tableTop + 25;
    doc.font('Helvetica');

    records.forEach((record) => {
      // Handle pagination
      if (y > 700) {
        doc.addPage();
        y = 50;
        // Reprint header on new page
        doc.font('Helvetica-Bold');
        doc.text('Member ID', 50, y);
        doc.text('Name', 130, y);
        doc.text('Type', 280, y);
        doc.text('Size', 340, y);
        doc.text('Status', 390, y);
        doc.text('Check-in Time', 450, y);
        doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
        y += 25;
        doc.font('Helvetica');
      }

      doc.text(record.user.memberId || 'N/A', 50, y);
      doc.text(record.user.fullName, 130, y, { width: 140, height: 15, ellipsis: true });
      doc.text(record.registration.registrationType, 280, y);
      doc.text(String(record.registration.attendeeCount), 340, y);
      
      // Color coding status text implicitly by checking status
      doc.text(record.attendanceStatus, 390, y);

      const checkInStr = record.checkInTime
        ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '-';
      doc.text(checkInStr, 450, y);

      y += 20;
    });

    doc.end();
  } catch (error: any) {
    console.error('PDF export error:', error);
    return res.status(500).json({ message: 'Server error generating PDF.', error: error.message });
  }
};
