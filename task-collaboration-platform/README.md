<<<<<<< HEAD
# TaskFlow - Real-Time Task Collaboration Platform

A full-stack MERN application for real-time task management and team collaboration, similar to Trello/Notion.

## 🚀 Features

- **User Authentication** - Secure signup/login with JWT
- **Boards Management** - Create, update, delete boards
- **Lists & Tasks** - Organize tasks in lists with drag-and-drop
- **Real-Time Sync** - Live updates across all connected users via WebSocket
- **Team Collaboration** - Assign users to tasks and boards
- **Activity Tracking** - Complete history of all board activities
- **Search & Pagination** - Efficient data retrieval
- **Responsive Design** - Works on desktop and mobile

## 🛠️ Tech Stack

### Frontend
- **React** 18.2+ - UI library
- **React Router** - Client-side routing
- **React Beautiful DnD** - Drag and drop functionality
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **TailwindCSS** - Styling
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)
- **npm** or **yarn** package manager

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd task-collaboration-platform
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - PORT=5000
# - MONGODB_URI=mongodb://localhost:27017/task-collaboration
# - JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
# - JWT_EXPIRE=7d
# - NODE_ENV=development
# - CLIENT_URL=http://localhost:3000

# Make sure MongoDB is running, then start the server
npm run dev
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Install additional required dependencies
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Start the development server
npm start
```

The frontend will start on `http://localhost:3000`

## 🗄️ Database Schema

### User Schema
```javascript
{
  name: String (required, max 50 chars),
  email: String (required, unique, lowercase),
  password: String (required, min 6 chars, hashed),
  avatar: String (optional),
  isActive: Boolean (default: true),
  timestamps: true
}
```

### Board Schema
```javascript
{
  title: String (required, max 100 chars),
  description: String (optional, max 500 chars),
  owner: ObjectId (ref: User),
  members: [ObjectId] (ref: User),
  backgroundColor: String (default: #0079bf),
  isArchived: Boolean (default: false),
  timestamps: true
}
```

### List Schema
```javascript
{
  title: String (required, max 100 chars),
  board: ObjectId (ref: Board),
  position: Number (required),
  isArchived: Boolean (default: false),
  timestamps: true
}
```

### Task Schema
```javascript
{
  title: String (required, max 200 chars),
  description: String (optional, max 2000 chars),
  list: ObjectId (ref: List),
  board: ObjectId (ref: Board),
  assignedTo: [ObjectId] (ref: User),
  position: Number (required),
  priority: String (enum: low/medium/high/urgent),
  dueDate: Date (optional),
  labels: [String],
  isArchived: Boolean (default: false),
  createdBy: ObjectId (ref: User),
  timestamps: true
}
```

### Activity Schema
```javascript
{
  board: ObjectId (ref: Board),
  user: ObjectId (ref: User),
  action: String (enum: create_board, update_board, etc.),
  targetType: String (enum: Board, List, Task),
  targetId: ObjectId,
  details: Mixed (JSON object),
  timestamps: true
}
```

## 🔌 API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Body: { name, email, password }
Response: { success, data: { _id, name, email, avatar, token } }
```

#### Login User
```
POST /api/auth/login
Body: { email, password }
Response: { success, data: { _id, name, email, avatar, token } }
```

#### Get Current User
```
GET /api/auth/me
Headers: { Authorization: Bearer <token> }
Response: { success, data: { user } }
```

### Board Endpoints

#### Get All Boards
```
GET /api/boards?page=1&limit=10&search=keyword
Headers: { Authorization: Bearer <token> }
Response: { success, data: [boards], pagination }
```

#### Get Single Board
```
GET /api/boards/:id
Headers: { Authorization: Bearer <token> }
Response: { success, data: { board } }
```

#### Create Board
```
POST /api/boards
Headers: { Authorization: Bearer <token> }
Body: { title, description, backgroundColor }
Response: { success, data: { board } }
```

#### Update Board
```
PUT /api/boards/:id
Headers: { Authorization: Bearer <token> }
Body: { title, description, backgroundColor }
Response: { success, data: { board } }
```

#### Delete Board
```
DELETE /api/boards/:id
Headers: { Authorization: Bearer <token> }
Response: { success, data: {} }
```

#### Add Member to Board
```
POST /api/boards/:id/members
Headers: { Authorization: Bearer <token> }
Body: { userId }
Response: { success, data: { board } }
```

### List Endpoints

#### Get Lists for Board
```
GET /api/boards/:boardId/lists
Headers: { Authorization: Bearer <token> }
Response: { success, data: [lists] }
```

#### Create List
```
POST /api/boards/:boardId/lists
Headers: { Authorization: Bearer <token> }
Body: { title }
Response: { success, data: { list } }
```

#### Update List
```
PUT /api/lists/:id
Headers: { Authorization: Bearer <token> }
Body: { title, position }
Response: { success, data: { list } }
```

#### Delete List
```
DELETE /api/lists/:id
Headers: { Authorization: Bearer <token> }
Response: { success, data: {} }
```

### Task Endpoints

#### Get Tasks for List
```
GET /api/lists/:listId/tasks?page=1&limit=50&search=keyword
Headers: { Authorization: Bearer <token> }
Response: { success, data: [tasks], pagination }
```

#### Get All Tasks for Board
```
GET /api/boards/:boardId/tasks
Headers: { Authorization: Bearer <token> }
Response: { success, data: [tasks] }
```

#### Create Task
```
POST /api/lists/:listId/tasks
Headers: { Authorization: Bearer <token> }
Body: { title, description, priority, dueDate, labels, assignedTo }
Response: { success, data: { task } }
```

#### Update Task
```
PUT /api/tasks/:id
Headers: { Authorization: Bearer <token> }
Body: { title, description, priority, dueDate, labels, assignedTo }
Response: { success, data: { task } }
```

#### Move Task
```
PUT /api/tasks/:id/move
Headers: { Authorization: Bearer <token> }
Body: { listId, position }
Response: { success, data: { task } }
```

#### Delete Task
```
DELETE /api/tasks/:id
Headers: { Authorization: Bearer <token> }
Response: { success, data: {} }
```

### Activity Endpoints

#### Get Board Activities
```
GET /api/boards/:boardId/activities?page=1&limit=20
Headers: { Authorization: Bearer <token> }
Response: { success, data: [activities], pagination }
```

## 🔄 Real-Time Events (WebSocket)

### Client → Server Events
- `join-board` - Join a board room
- `leave-board` - Leave a board room
- `board-updated` - Board was updated
- `list-created` - New list created
- `list-updated` - List updated
- `list-deleted` - List deleted
- `task-created` - New task created
- `task-updated` - Task updated
- `task-moved` - Task moved between lists
- `task-deleted` - Task deleted
- `member-assigned` - Member assigned to task

### Server → Client Events
Same event names as above, broadcasted to all clients in the board room except sender

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

## 🎨 Frontend Architecture

### Component Structure
```
src/
├── components/       # Reusable UI components
├── pages/            # Page components (Login, Register, Boards, BoardDetail)
├── context/          # React Context (AuthContext)
├── services/         # API and Socket services
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
└── styles/           # Global styles
```

### State Management
- **React Context API** - Global auth state
- **Component State** - Local UI state
- **Socket.IO** - Real-time state synchronization

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API routes with middleware
- Input validation
- Rate limiting (100 requests per 15 minutes)
- Helmet.js for security headers
- CORS configuration

## 📊 Performance Optimizations

### Database
- Indexed fields for faster queries
- Pagination for large datasets
- Efficient query design with population

### Frontend
- Code splitting with React Router
- Optimistic UI updates
- Debounced search functionality
- Lazy loading of components

## 🚀 Deployment Guide

### Deploy to Heroku (Backend)

```bash
# Login to Heroku
heroku login

# Create new app
heroku create your-app-name-backend

# Add MongoDB Atlas connection
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_secret_key
heroku config:set CLIENT_URL=your_frontend_url
heroku config:set NODE_ENV=production

# Deploy
git subtree push --prefix backend heroku main

# Or for first time
cd backend
git init
heroku git:remote -a your-app-name-backend
git add .
git commit -m "Initial commit"
git push heroku main
```

### Deploy to Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Add environment variables in Vercel dashboard:
# REACT_APP_API_URL=your_backend_url
# REACT_APP_SOCKET_URL=your_backend_url
```

### Deploy to Render.com

1. **Backend:**
   - Create new Web Service
   - Connect GitHub repository
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Add environment variables

2. **Frontend:**
   - Create new Static Site
   - Connect GitHub repository
   - Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `build`
   - Add environment variables

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create new cluster (Free tier available)
3. Set up database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get connection string
6. Replace in .env: `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname`

## 👥 Demo Credentials

```
Email: demo@taskflow.com
Password: demo123

Email: user@taskflow.com
Password: user123
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### CORS Errors
- Ensure CLIENT_URL in backend .env matches frontend URL
- Check CORS configuration in server.js

## 📝 Assumptions & Trade-offs

### Assumptions
- Users have stable internet for real-time features
- MongoDB is accessible and configured correctly
- Modern browsers with WebSocket support

### Trade-offs
- Real-time updates increase server load
- Drag-and-drop may not work on all mobile devices
- Pagination limits may need adjustment for large datasets

## 🔮 Future Enhancements

- [ ] File attachments for tasks
- [ ] Email notifications
- [ ] Advanced search and filters
- [ ] Task comments and discussions
- [ ] Calendar view
- [ ] Time tracking
- [ ] Custom fields and templates
- [ ] Mobile app (React Native)
- [ ] Dark mode
- [ ] Internationalization (i18n)

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Your Name - Full Stack Engineer Interview Assignment

## 🙏 Acknowledgments

- React Beautiful DnD for drag-and-drop
- Socket.IO for real-time communication
- TailwindCSS for styling
- MongoDB for database
=======
# task-collaboration
>>>>>>> 19c8cea0dd872662c498710b340f5816ab0453af
