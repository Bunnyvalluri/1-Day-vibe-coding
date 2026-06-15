import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data
  await prisma.notification.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.ministry.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create hashed passwords
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const leaderPassword = await bcrypt.hash('Leader123!', 10);
  const memberPassword = await bcrypt.hash('Member123!', 10);

  // 3. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      fullName: 'Elijah Vance',
      email: 'superadmin@church.com',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      phone: '+15550100',
      memberId: 'M-77777',
    },
  });

  const admin = await prisma.user.create({
    data: {
      fullName: 'Sarah Jenkins',
      email: 'admin@church.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+15550101',
      memberId: 'M-10001',
    },
  });

  const worshipLeader = await prisma.user.create({
    data: {
      fullName: 'David Praise',
      email: 'worship@church.com',
      password: leaderPassword,
      role: 'MINISTRY_LEADER',
      phone: '+15550102',
      memberId: 'M-20001',
    },
  });

  const youthLeader = await prisma.user.create({
    data: {
      fullName: 'Joshua Strong',
      email: 'youth@church.com',
      password: leaderPassword,
      role: 'MINISTRY_LEADER',
      phone: '+15550103',
      memberId: 'M-20002',
    },
  });

  const member1 = await prisma.user.create({
    data: {
      fullName: 'Grace Miller',
      email: 'member@church.com',
      password: memberPassword,
      role: 'MEMBER',
      phone: '+15550104',
      memberId: 'M-30001',
    },
  });

  const member2 = await prisma.user.create({
    data: {
      fullName: 'Caleb Peterson',
      email: 'caleb@church.com',
      password: memberPassword,
      role: 'MEMBER',
      phone: '+15550105',
      memberId: 'M-30002',
    },
  });

  const member3 = await prisma.user.create({
    data: {
      fullName: 'Hannah Wilson',
      email: 'hannah@church.com',
      password: memberPassword,
      role: 'MEMBER',
      phone: '+15550106',
      memberId: 'M-30003',
    },
  });

  console.log('Users seeded.');

  // 4. Create Ministries
  const worshipMinistry = await prisma.ministry.create({
    data: {
      name: 'Worship & Creative Arts',
      description: 'Responsible for Sunday music, tech, and production.',
      leaderId: worshipLeader.id,
      status: 'ACTIVE',
    },
  });

  const youthMinistry = await prisma.ministry.create({
    data: {
      name: 'Youth Ministry (Radiant)',
      description: 'Nurturing teenagers and high school students in faith.',
      leaderId: youthLeader.id,
      status: 'ACTIVE',
    },
  });

  const outreachMinistry = await prisma.ministry.create({
    data: {
      name: 'Community Outreach',
      description: 'Local food drives, charity, and missionary service.',
      leaderId: admin.id,
      status: 'ACTIVE',
    },
  });

  // Link leaders to ministries
  await prisma.user.update({
    where: { id: worshipLeader.id },
    data: { ministryId: worshipMinistry.id },
  });
  await prisma.user.update({
    where: { id: youthLeader.id },
    data: { ministryId: youthMinistry.id },
  });
  await prisma.user.update({
    where: { id: member1.id },
    data: { ministryId: worshipMinistry.id }, // Member joins worship
  });

  console.log('Ministries seeded.');

  // 5. Create Events
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const event1 = await prisma.event.create({
    data: {
      title: 'Sunday Morning Worship Experience',
      description: 'Join us for a dynamic service of praise, worship, and an inspiring message.',
      category: 'Worship',
      venue: 'Main Sanctuary',
      capacity: 300,
      startDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 9, 0),
      endDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 11, 0),
      registrationDeadline: new Date(nextWeek.getTime() - 24 * 60 * 60 * 1000),
      status: 'OPEN',
      ministryId: worshipMinistry.id,
      organizerId: worshipLeader.id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: 'Youth Explosion Summer Camp 2026',
      description: 'A 3-day action-packed retreat for teens. Music, games, workshops, and worship.',
      category: 'Retreat',
      venue: 'Fellowship Forest Campgrounds',
      capacity: 100,
      startDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonth.getDate(), 15, 0),
      endDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonth.getDate() + 3, 12, 0),
      registrationDeadline: new Date(nextMonth.getTime() - 5 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      ministryId: youthMinistry.id,
      organizerId: youthLeader.id,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      title: 'Midweek Power Prayer Meeting',
      description: 'A dedicated time for intercessory prayer, worship, and quiet reflection.',
      category: 'Prayer Meeting',
      venue: 'Chapel Room A',
      capacity: 50,
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 1.5 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      ministryId: worshipMinistry.id,
      organizerId: worshipLeader.id,
    },
  });

  const event4 = await prisma.event.create({
    data: {
      title: 'Community Food Drive & Outreach',
      description: 'Distributing food baskets to local families in need. Volunteers welcome!',
      category: 'Outreach',
      venue: 'Downtown Community Center',
      capacity: 150,
      startDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      registrationDeadline: new Date(nextWeek.getTime() + 24 * 60 * 60 * 1000),
      status: 'OPEN',
      ministryId: outreachMinistry.id,
      organizerId: admin.id,
    },
  });

  const pastEvent = await prisma.event.create({
    data: {
      title: 'Pentecost Weekend Conference 2026',
      description: 'A special conference reflecting on the Acts of the Apostles, with guest speakers.',
      category: 'Conference',
      venue: 'Main Sanctuary',
      capacity: 250,
      startDate: new Date(pastWeek.getFullYear(), pastWeek.getMonth(), pastWeek.getDate(), 9, 0),
      endDate: new Date(pastWeek.getFullYear(), pastWeek.getMonth(), pastWeek.getDate(), 17, 0),
      registrationDeadline: new Date(pastWeek.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
      ministryId: worshipMinistry.id,
      organizerId: worshipLeader.id,
    },
  });

  console.log('Events seeded.');

  // 6. Create Registrations & Attendance for Completed/Past Event
  // We want to show attendance history, so let's register members and mark their attendance.
  const users = [member1, member2, member3];
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const reg = await prisma.registration.create({
      data: {
        eventId: pastEvent.id,
        userId: user.id,
        registrationType: 'INDIVIDUAL',
        attendeeCount: 1,
        status: i === 2 ? 'ABSENT' : 'ATTENDED',
        notes: `Test registration for ${user.fullName}`,
        registeredAt: new Date(pastWeek.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.attendance.create({
      data: {
        registrationId: reg.id,
        eventId: pastEvent.id,
        userId: user.id,
        checkInTime: i === 2 ? null : new Date(pastWeek.getTime() + 30 * 60 * 1000), // 30 mins late or on time
        attendanceStatus: i === 2 ? 'ABSENT' : (i === 1 ? 'LATE' : 'PRESENT'),
        markedById: worshipLeader.id,
        markedBy: worshipLeader.fullName,
      },
    });
  }

  // Pre-register Member 1 for the Sunday Morning Worship
  const reg1 = await prisma.registration.create({
    data: {
      eventId: event1.id,
      userId: member1.id,
      registrationType: 'INDIVIDUAL',
      attendeeCount: 1,
      status: 'CONFIRMED',
      notes: 'Looking forward to it!',
    },
  });

  // Pre-register Member 2 (with a family member) for the Sunday Morning Worship
  const reg2 = await prisma.registration.create({
    data: {
      eventId: event1.id,
      userId: member2.id,
      registrationType: 'FAMILY',
      attendeeCount: 2,
      notes: 'Bringing my spouse.',
    },
  });

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: member1.id,
      title: 'Registration Confirmed',
      message: 'You have registered successfully for Sunday Morning Worship Experience.',
      type: 'INFO',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: member1.id,
      title: 'Welcome to Church Events!',
      message: 'Explore and register for upcoming ministries, services, and outreach events.',
      type: 'INFO',
      isRead: true,
    },
  });

  console.log('Registrations and Attendance seeded.');
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
