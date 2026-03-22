require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');

const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const paymentRoutes = require('./routes/payments');
const quizRoutes = require('./routes/quiz');
const ratingRoutes = require('./routes/ratings');
const adminRoutes = require('./routes/admin');
const progressRoutes = require('./routes/progress');
const commentRoutes = require('./routes/comments');
const pollRoutes = require('./routes/polls');

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
});

// Export io for use in controllers
module.exports.io = io;

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
