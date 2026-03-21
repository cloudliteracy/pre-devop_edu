require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const paymentRoutes = require('./routes/payments');
const quizRoutes = require('./routes/quiz');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/quiz', quizRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'CloudLiteracy API Server' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
