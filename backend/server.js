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

app.get('/', (req, res) => {
  res.json({ message: 'CloudLiteracy API Server' });
});

// Online users tracking
const onlineUsers = new Map();
const Progress = require('./models/Progress');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user-online', (userData) => {
    onlineUsers.set(socket.id, {
      userId: userData.userId,
      userName: userData.userName,
      userEmail: userData.userEmail,
      currentModule: userData.currentModule || null,
      connectedAt: new Date()
    });
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
