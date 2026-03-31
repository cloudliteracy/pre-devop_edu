require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const { optionalAuth } = require('./middleware/auth');
const trackVisitor = require('./middleware/trackVisitor');

const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const paymentRoutes = require('./routes/payments');
const quizRoutes = require('./routes/quiz');
const ratingRoutes = require('./routes/ratings');
const adminRoutes = require('./routes/admin');
const progressRoutes = require('./routes/progress');
const commentRoutes = require('./routes/comments');
const pollRoutes = require('./routes/polls');
const contentRoutes = require('./routes/content');
const announcementRoutes = require('./routes/announcements');
const csrRoutes = require('./routes/csr');
const voucherRoutes = require('./routes/vouchers');
const helpdeskRoutes = require('./routes/helpdesk');
const testimonialRoutes = require('./routes/testimonials');
const aiQRRoutes = require('./routes/aiQR');
const referralRoutes = require('./routes/referrals');
const { startVoucherExpirationCron } = require('./cronJobs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

connectDB();

app.use(cors());
app.use(express.json());
app.use(optionalAuth);
app.use(trackVisitor);
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/csr', csrRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/helpdesk', helpdeskRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/ai-qr', aiQRRoutes);
app.use('/api/referrals', referralRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'CloudLiteracy API Server' });
});

// Online users tracking
const onlineUsers = new Map();
const Progress = require('./models/Progress');
const geoip = require('geoip-lite');

// Make io accessible globally for admin suspension
app.set('io', io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user-online', (userData) => {
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    const ip = clientIp.split(',')[0].trim();
    const geo = geoip.lookup(ip);
    
    onlineUsers.set(socket.id, {
      userId: userData.userId,
      userName: userData.userName,
      userEmail: userData.userEmail,
      currentModule: userData.currentModule || null,
      connectedAt: new Date(),
      location: geo ? {
        country: geo.country,
        city: geo.city || 'Unknown',
        region: geo.region
      } : {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown'
      }
    });
    
    // Store socket id by user email for suspension feature
    socket.userEmail = userData.userEmail;
    
    io.emit('online-users-update', Array.from(onlineUsers.values()));
  });

  socket.on('update-activity', async (data) => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      user.currentModule = data.currentModule;
      
      if (data.currentModule && data.currentModule.moduleId) {
        try {
          const progress = await Progress.findOne({
            userId: user.userId,
            moduleId: data.currentModule.moduleId
          });
          
          if (progress) {
            user.currentModule.progress = progress.completionPercentage || 0;
          }
        } catch (error) {
          console.error('Error fetching progress:', error);
        }
      }
      
      io.emit('online-users-update', Array.from(onlineUsers.values()));
    }
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('online-users-update', Array.from(onlineUsers.values()));
    console.log('User disconnected:', socket.id);
  });

  // Help Desk Socket Events
  socket.on('join-helpdesk', (sessionId) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined helpdesk session: ${sessionId}`);
  });

  socket.on('leave-helpdesk', (sessionId) => {
    socket.leave(sessionId);
    console.log(`Socket ${socket.id} left helpdesk session: ${sessionId}`);
  });

  socket.on('helpdesk:exchange-key', (data) => {
    // Broadcast public key to other participants in the session
    socket.to(data.sessionId).emit('helpdesk:key-exchange', {
      sessionId: data.sessionId,
      publicKey: data.publicKey
    });
    console.log(`Key exchange in session: ${data.sessionId}`);
  });
});

// Export io for use in controllers
module.exports.io = io;

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Create upload directories if they don't exist
  const fs = require('fs');
  const uploadDirs = [
    'uploads/pdfs',
    'uploads/videos',
    'uploads/vouchers',
    'uploads/survey-responses',
    'uploads/testimonials',
    'uploads/ai-knowledge'
  ];
  
  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
  
  // Start cron jobs
  startVoucherExpirationCron();
});
