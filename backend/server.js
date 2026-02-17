require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require("./routes/authRoutes");
const boardRoutes = require("./routes/boardRoutes");
const listRoutes = require("./routes/listRoutes");
const taskRoutes = require("./routes/taskRoutes");
const activityRoutes = require("./routes/activityRoutes");
const userRoutes = require("./routes/userRoutes");


// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a board room
  socket.on('join-board', (boardId) => {
    socket.join(`board-${boardId}`);
    console.log(`Socket ${socket.id} joined board-${boardId}`);
  });

  // Leave a board room
  socket.on('leave-board', (boardId) => {
    socket.leave(`board-${boardId}`);
    console.log(`Socket ${socket.id} left board-${boardId}`);
  });

  // Handle board updates
  socket.on('board-updated', (data) => {
    socket.to(`board-${data.boardId}`).emit('board-updated', data);
  });

  // Handle list creation
  socket.on('list-created', (data) => {
    socket.to(`board-${data.boardId}`).emit('list-created', data);
  });

  // Handle list updates
  socket.on('list-updated', (data) => {
    socket.to(`board-${data.boardId}`).emit('list-updated', data);
  });

  // Handle list deletion
  socket.on('list-deleted', (data) => {
    socket.to(`board-${data.boardId}`).emit('list-deleted', data);
  });

  // Handle task creation
  socket.on('task-created', (data) => {
    socket.to(`board-${data.boardId}`).emit('task-created', data);
  });

  // Handle task updates
  socket.on('task-updated', (data) => {
    socket.to(`board-${data.boardId}`).emit('task-updated', data);
  });

  // Handle task movement
  socket.on('task-moved', (data) => {
    socket.to(`board-${data.boardId}`).emit('task-moved', data);
  });

  // Handle task deletion
  socket.on('task-deleted', (data) => {
    socket.to(`board-${data.boardId}`).emit('task-deleted', data);
  });

  // Handle member assignment
  socket.on('member-assigned', (data) => {
    socket.to(`board-${data.boardId}`).emit('member-assigned', data);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
// Routes
// Routes
// Routes
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/boards', boardRoutes);

// Nested routes for lists
app.use('/api/boards/:boardId/lists', listRoutes);

// Nested routes for tasks
app.use('/api/lists/:listId/tasks', taskRoutes);
app.use("/api/tasks", require("./routes/taskRoutes")); 
// Board tasks route
app.use('/api/boards/:boardId/tasks', (req, res, next) => {
  const { getBoardTasks } = require('./controllers/taskController');
  getBoardTasks(req, res, next);
});

// Activities route
app.use('/api/boards/:boardId/activities', activityRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});
// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = { app, server, io };
