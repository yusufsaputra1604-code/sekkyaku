const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../uploads');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use('/uploads', express.static(uploadsPath));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sekkyaku API running' });
});

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const dealRoutes = require('./routes/deals');
const dashboardRoutes = require('./routes/dashboard');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const invoiceRoutes = require('./routes/invoices');
const assetRoutes = require('./routes/assets');
const reportRoutes = require('./routes/reports');
const activityRoutes = require('./routes/activities');
const reminderRoutes = require('./routes/reminders');
const quotationRoutes = require('./routes/quotations');
const calendarRoutes = require('./routes/calendar');
const timeLogRoutes = require('./routes/timeLogs');
const portalRoutes = require('./routes/portal');

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/time-logs', timeLogRoutes);
app.use('/api/portal', portalRoutes);

const frontendPath = path.join(__dirname, '../../client/dist');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
