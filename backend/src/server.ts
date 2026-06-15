import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyToken, verifyTokenOptional, requireRole } from './middleware/auth';

// Load environment variables
dotenv.config();

// Import controllers
import * as authController from './controllers/authController';
import * as eventController from './controllers/eventController';
import * as registrationController from './controllers/registrationController';
import * as attendanceController from './controllers/attendanceController';
import * as reportController from './controllers/reportController';
import * as notificationController from './controllers/notificationController';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for development
app.use(express.json());

// Base Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

/* ==========================================================================
   AUTHENTICATION & USER ROUTES
   ========================================================================== */
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', verifyToken, authController.getProfile);
app.put('/api/auth/profile', verifyToken, authController.updateProfile);
app.get('/api/auth/users', verifyToken, requireRole(['ADMIN', 'SUPER_ADMIN']), authController.getAllUsers);
app.put('/api/auth/roles', verifyToken, requireRole(['ADMIN', 'SUPER_ADMIN']), authController.updateRole);
app.get('/api/auth/ministries', authController.getAllMinistries);

/* ==========================================================================
   EVENT MANAGEMENT ROUTES
   ========================================================================== */
app.get('/api/events', verifyTokenOptional, eventController.getEvents);
app.get('/api/events/:id', verifyTokenOptional, eventController.getEventById);
app.post('/api/events', verifyToken, requireRole(['MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN']), eventController.createEvent);
app.put('/api/events/:id', verifyToken, requireRole(['MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN']), eventController.updateEvent);
app.delete('/api/events/:id', verifyToken, requireRole(['ADMIN', 'SUPER_ADMIN']), eventController.deleteEvent);

/* ==========================================================================
   REGISTRATION ROUTES
   ========================================================================== */
app.post('/api/register', verifyToken, registrationController.registerForEvent);
app.get('/api/my-registrations', verifyToken, registrationController.getMyRegistrations);
app.delete('/api/cancel-registration/:id', verifyToken, registrationController.cancelRegistration);
app.get('/api/registrations/:id/qr', verifyToken, registrationController.getRegistrationQR);

/* ==========================================================================
   ATTENDANCE ROUTES
   ========================================================================== */
app.post('/api/attendance/checkin', verifyToken, requireRole(['MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN']), attendanceController.checkInQR);
app.post('/api/attendance/manual', verifyToken, requireRole(['MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN']), attendanceController.markAttendanceManual);
app.get('/api/attendance/:eventId', verifyToken, requireRole(['MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN']), attendanceController.getEventAttendance);

/* ==========================================================================
   REPORT & ANALYTICS ROUTES
   ========================================================================== */
app.get('/api/reports/stats', verifyToken, requireRole(['ADMIN', 'SUPER_ADMIN']), reportController.getAdminDashboardStats);
app.get('/api/reports/attendance/:eventId/csv', verifyToken, requireRole(['MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN']), reportController.exportEventAttendanceCSV);
app.get('/api/reports/attendance/:eventId/pdf', verifyToken, requireRole(['MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN']), reportController.exportEventAttendancePDF);

/* ==========================================================================
   NOTIFICATION ROUTES
   ========================================================================== */
app.get('/api/notifications', verifyToken, notificationController.getMyNotifications);
app.put('/api/notifications/read-all', verifyToken, notificationController.markAllAsRead);
app.put('/api/notifications/:id/read', verifyToken, notificationController.markAsRead);
app.post('/api/notifications/broadcast', verifyToken, requireRole(['MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN']), notificationController.broadcastNotification);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.', error: err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
