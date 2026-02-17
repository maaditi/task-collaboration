# Quick Start Guide - TaskFlow

Get TaskFlow up and running in under 10 minutes!

## ⚡ Prerequisites (2 minutes)

### Required Software
- ✅ Node.js v16+ ([Download](https://nodejs.org/))
- ✅ MongoDB v5+ ([Download](https://www.mongodb.com/try/download/community))
- ✅ Git ([Download](https://git-scm.com/))

### Verify Installation
```bash
node --version    # Should show v16 or higher
npm --version     # Should show 8 or higher
mongod --version  # Should show v5 or higher
git --version     # Any recent version
```

---

## 🚀 Setup (5 minutes)

### Step 1: Get the Code
```bash
# Clone the repository
git clone <your-repository-url>
cd task-collaboration-platform
```

### Step 2: Start MongoDB
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux (Ubuntu/Debian)
sudo systemctl start mongod

# Windows (Run as Administrator)
net start MongoDB
```

### Step 3: Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Your .env should look like this:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/task-collaboration
# JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
# JWT_EXPIRE=7d
# NODE_ENV=development
# CLIENT_URL=http://localhost:3000

# Start the backend server
npm run dev
```

✅ Backend should now be running on http://localhost:5000

### Step 4: Setup Frontend (New Terminal)
```bash
# Open a new terminal window
cd task-collaboration-platform/frontend

# Install dependencies
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Start the frontend server
npm start
```

✅ Frontend should automatically open at http://localhost:3000

---

## 🎯 First Use (2 minutes)

### 1. Register Your Account
- Open http://localhost:3000
- Click "Register"
- Fill in your details:
  - Name: Your Name
  - Email: your@email.com
  - Password: password123 (min 6 characters)
- Click "Register"

### 2. Create Your First Board
- You'll be redirected to the Boards page
- Click "+ Create Board"
- Enter board details:
  - Title: "My First Board"
  - Description: "Getting started with TaskFlow"
- Click "Create"

### 3. Add Lists
- Click on your board to open it
- In the "+ Add list" field, type "To Do"
- Press Enter
- Repeat for "In Progress" and "Done"

### 4. Add Tasks
- Under "To Do" list, click "Add a task..."
- Type "Create my first task"
- Press Enter
- Add more tasks as needed

### 5. Try Drag and Drop
- Drag a task from "To Do" to "In Progress"
- See how it updates in real-time!

---

## 🧪 Test the Features

### Real-Time Collaboration
Open http://localhost:3000 in a second browser window (or incognito mode):

1. Login with a different account
2. Have both windows open the same board
3. Make changes in one window
4. Watch them appear instantly in the other! ⚡

### API Testing
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🎨 UI Features to Explore

### Board Management
- ✨ Create multiple boards
- 🎨 Change board colors
- 👥 Add team members
- 📋 Search boards

### Task Organization
- 📝 Add task descriptions
- 🏷️ Set task priority (low/medium/high/urgent)
- 📅 Add due dates
- 🏷️ Add labels
- 👤 Assign to users

### Drag and Drop
- 🔄 Drag tasks between lists
- 📊 Reorder tasks within lists
- ⚡ Real-time updates across all users

---

## 🔍 Troubleshooting

### Backend won't start

**Error: "Port 5000 already in use"**
```bash
# Kill the process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env file
PORT=5001
```

**Error: "Cannot connect to MongoDB"**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

### Frontend won't start

**Error: "Port 3000 already in use"**
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9
```

**Error: "Module not found"**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Connection Issues

**CORS errors**
- Make sure `CLIENT_URL` in backend `.env` is set to `http://localhost:3000`
- Restart the backend server

**WebSocket not connecting**
- Check browser console for errors
- Verify backend is running on port 5000
- Check firewall settings

---

## 📚 Next Steps

### Learn More
- 📖 Read [README.md](README.md) for full documentation
- 🏗️ Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- 🚀 See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- 📡 Review [API_CONTRACT.md](API_CONTRACT.md) for API details
- 🗄️ Study [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for data structure

### Customize Your Instance
- Change color scheme in frontend
- Add custom task fields
- Implement notifications
- Add file attachments
- Create custom reports

### Deploy to Production
Follow the deployment guide to deploy on:
- ✅ Heroku + Vercel (Free tier available)
- ✅ Render.com (Free tier available)
- ✅ AWS EC2
- ✅ DigitalOcean
- ✅ Docker containers

---

## 🆘 Getting Help

### Check Documentation
1. Start with this Quick Start Guide
2. Read the README for detailed information
3. Check API Contract for endpoint details
4. Review Architecture for system design

### Common Questions

**Q: Can I use this for production?**
A: Yes! Follow the DEPLOYMENT.md guide for production setup.

**Q: How do I add more users?**
A: Each user needs to register their own account. Board owners can then add them as members.

**Q: Is real-time sync working?**
A: Test by opening two browser windows. Changes in one should appear in the other immediately.

**Q: How do I backup my data?**
A: Use MongoDB's `mongodump` command:
```bash
mongodump --db task-collaboration --out ./backup
```

**Q: Can I customize the UI?**
A: Yes! All frontend code is in `frontend/src`. Modify components and styles as needed.

---

## 📊 Development Workflow

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Quality
```bash
# Backend linting
cd backend
npm run lint

# Frontend linting
cd frontend
npm run lint
```

### Build for Production
```bash
# Backend (no build needed, runs directly)
cd backend
npm start

# Frontend
cd frontend
npm run build
# Creates optimized production build in /build directory
```

---

## 🎓 Sample Usage Scenarios

### Scenario 1: Personal Task Management
```
Board: "Personal Projects"
Lists: ["Ideas", "In Progress", "Completed"]
Tasks: Your personal to-dos and projects
```

### Scenario 2: Team Sprint Board
```
Board: "Sprint 23"
Lists: ["Backlog", "In Progress", "Review", "Done"]
Tasks: User stories with assignments and priorities
```

### Scenario 3: Content Planning
```
Board: "Content Calendar"
Lists: ["Ideas", "Writing", "Editing", "Published"]
Tasks: Blog posts with due dates and labels
```

---

## 🔐 Demo Credentials

For testing purposes, you can use these credentials:

```
Email: demo@taskflow.com
Password: demo123

Email: user@taskflow.com
Password: user123
```

*(Note: Create these accounts yourself for local testing)*

---

## ⚙️ Environment Variables Reference

### Backend Required Variables
```bash
PORT=5000                          # Server port
MONGODB_URI=mongodb://...          # Database connection
JWT_SECRET=secret_key              # JWT signing key
JWT_EXPIRE=7d                      # Token expiration
NODE_ENV=development               # Environment
CLIENT_URL=http://localhost:3000   # Frontend URL
```

### Frontend Required Variables
```bash
REACT_APP_API_URL=http://localhost:5000/api        # Backend API
REACT_APP_SOCKET_URL=http://localhost:5000         # WebSocket server
```

---

## 🎯 Success Checklist

After completing this guide, you should be able to:

- [x] Start MongoDB locally
- [x] Run the backend server
- [x] Run the frontend application
- [x] Register and login
- [x] Create boards and lists
- [x] Add and move tasks
- [x] See real-time updates
- [x] Test API endpoints

---

## 🚀 You're All Set!

Congratulations! TaskFlow is now running on your machine. You can:

1. **Explore the features** - Create boards, lists, and tasks
2. **Test collaboration** - Open multiple windows to see real-time sync
3. **Read the docs** - Learn about architecture and deployment
4. **Customize it** - Make it your own!
5. **Deploy it** - Share with your team!

### Need More Help?

- 📖 Full documentation in README.md
- 🏗️ System design in ARCHITECTURE.md
- 🚀 Deployment guide in DEPLOYMENT.md
- 📡 API reference in API_CONTRACT.md

Happy task managing! 🎉
