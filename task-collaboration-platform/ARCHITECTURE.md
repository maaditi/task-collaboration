# Architecture Documentation

## System Architecture Overview

TaskFlow follows a modern three-tier architecture pattern with real-time capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   React     │  │  Socket.IO  │  │   Axios     │         │
│  │   Router    │  │   Client    │  │   Client    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Express   │  │  Socket.IO  │  │     JWT     │         │
│  │   Server    │  │   Server    │  │    Auth     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Routes    │  │ Controllers │  │ Middleware  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Mongoose   │  │   MongoDB   │  │   Indexes   │         │
│  │    ODM      │  │  Database   │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App (Router, Auth Provider)
├── Login/Register (Public Routes)
└── Authenticated Routes
    ├── Boards (Board List View)
    │   ├── BoardCard Components
    │   └── CreateBoard Modal
    └── BoardDetail (Main Collaboration View)
        ├── Header with Navigation
        ├── Lists Container (Drag-Drop Context)
        │   ├── List Component (Droppable)
        │   │   ├── Task Cards (Draggable)
        │   │   └── Add Task Form
        │   └── Add List Component
        └── Activity Sidebar (Optional)
```

### State Management Strategy

#### 1. **Authentication State** (Context API)
- Global user authentication state
- Persistent across app reload
- Manages login/logout/register

```javascript
AuthContext provides:
- user: Current user object
- isAuthenticated: Boolean
- login(credentials)
- register(userData)
- logout()
```

#### 2. **Component Local State** (useState)
- UI state (modals, forms, loading)
- Temporary data (input values)
- Component-specific state

#### 3. **Real-Time State** (Socket.IO + useEffect)
- Board state synchronized across clients
- Automatic updates on changes
- Event-driven state updates

### Data Flow

```
User Action → API Call → Backend Processing → Database Update
     ↓                                              ↓
  Optimistic UI Update                    WebSocket Emit
     ↓                                              ↓
  Local State Update  ←────────── Socket Broadcast to Other Clients
```

## Backend Architecture

### Layered Architecture

```
┌──────────────────────────────────────────────────┐
│              Routes Layer                         │
│  - Define API endpoints                          │
│  - Apply middleware                              │
│  - Route to controllers                          │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│           Middleware Layer                        │
│  - Authentication (JWT verify)                   │
│  - Authorization (Role/Permission check)         │
│  - Validation (Input sanitization)               │
│  - Error handling                                │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│           Controller Layer                        │
│  - Business logic                                │
│  - Request handling                              │
│  - Response formatting                           │
│  - Socket event emission                         │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│             Model Layer                           │
│  - Data schemas                                  │
│  - Validation rules                              │
│  - Virtual properties                            │
│  - Instance methods                              │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│            Database Layer                         │
│  - MongoDB                                       │
│  - Indexes for performance                       │
│  - Data persistence                              │
└──────────────────────────────────────────────────┘
```

### Request Flow Example (Create Task)

```
1. Client sends POST /api/lists/:listId/tasks
2. Express router matches route
3. Auth middleware verifies JWT token
4. Controller receives request
5. Validate input data
6. Create task in database via Mongoose
7. Create activity record
8. Emit socket event to board room
9. Return task data to client
10. Other connected clients receive socket event
11. Clients update their UI automatically
```

## Database Design

### Schema Relationships

```
User (1) ──────┬── owns (1:N) ──> Board
               │
               └── member of (N:M) ──> Board

Board (1) ────── contains (1:N) ──> List

List (1) ─────── contains (1:N) ──> Task

Task (N) ─────── assigned to (N:M) ──> User

Board (1) ────── has (1:N) ──> Activity
User (1) ─────── performs (1:N) ──> Activity
```

### Indexing Strategy

**Performance-Critical Indexes:**

1. **User.email** (unique) - Fast login lookup
2. **Board.owner + Board.createdAt** - User's boards query
3. **Board.members + Board.createdAt** - Shared boards query
4. **List.board + List.position** - Fast list ordering
5. **Task.list + Task.position** - Fast task ordering
6. **Task.board + Task.isArchived** - Board tasks query
7. **Activity.board + Activity.createdAt** - Activity history

## Real-Time Synchronization Strategy

### Socket.IO Event Architecture

**Room-Based Broadcasting:**
- Each board has its own Socket.IO room
- Clients join/leave rooms when viewing boards
- Events broadcast only to relevant board members

**Event Flow:**

```
User A's Client
      ↓
   API Update
      ↓
   Database
      ↓
Socket Emit (to board room)
      ↓
      ├─> User B's Client (updates UI)
      ├─> User C's Client (updates UI)
      └─> User D's Client (updates UI)
```

**Handled Events:**

1. **Board Operations**
   - `board-updated` - Board details changed
   
2. **List Operations**
   - `list-created` - New list added
   - `list-updated` - List title/position changed
   - `list-deleted` - List removed

3. **Task Operations**
   - `task-created` - New task added
   - `task-updated` - Task details changed
   - `task-moved` - Task dragged to different list
   - `task-deleted` - Task removed

4. **Member Operations**
   - `member-assigned` - User assigned to task

### Conflict Resolution

**Last-Write-Wins Strategy:**
- Database timestamp determines final state
- Socket updates provide immediate feedback
- Re-fetch data if conflict detected
- Optimistic UI updates with rollback on error

## Security Architecture

### Authentication Flow

```
1. User submits credentials
2. Server validates against database
3. Password verified with bcrypt
4. JWT token generated with user ID
5. Token sent to client
6. Client stores token (localStorage)
7. Token included in all subsequent requests
8. Middleware verifies token on protected routes
```

### Authorization Layers

1. **Route Protection**
   - All API routes require valid JWT
   - Socket connections authenticated

2. **Resource Ownership**
   - Board owner can modify board
   - Board members can add tasks
   - Task creator and assignees can update

3. **Input Validation**
   - Express-validator for sanitization
   - Mongoose schema validation
   - Custom business logic validation

### Security Measures

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet.js**: Security headers
- **CORS**: Restricted to frontend domain
- **Password Hashing**: bcrypt with salt rounds
- **JWT Expiration**: 7 days default
- **Input Sanitization**: XSS prevention
- **MongoDB Injection Prevention**: Mongoose escaping

## Scalability Considerations

### Current Architecture (Single Server)

```
Load Balancer
      ↓
┌─────────────┐
│   Node.js   │
│   Server    │
└─────────────┘
      ↓
┌─────────────┐
│   MongoDB   │
└─────────────┘
```

### Horizontal Scaling Strategy

For production at scale:

```
                Load Balancer
                      ↓
        ┌─────────────┴─────────────┐
        ↓                           ↓
┌──────────────┐            ┌──────────────┐
│  Node.js 1   │            │  Node.js 2   │
│  (Primary)   │            │  (Replica)   │
└──────────────┘            └──────────────┘
        ↓                           ↓
┌────────────────────────────────────────┐
│        Redis (Session Store)           │
│   + Socket.IO Adapter (Pub/Sub)        │
└────────────────────────────────────────┘
                      ↓
        ┌─────────────┴─────────────┐
        ↓                           ↓
┌──────────────┐            ┌──────────────┐
│  MongoDB     │◄──────────►│  MongoDB     │
│  Primary     │            │  Replica     │
└──────────────┘            └──────────────┘
```

### Scaling Recommendations

1. **Application Tier**
   - Add Socket.IO Redis adapter for multi-server
   - Use PM2 for process management
   - Implement stateless sessions

2. **Database Tier**
   - MongoDB replica set for high availability
   - Sharding for horizontal partitioning
   - Read replicas for read-heavy operations

3. **Caching Layer**
   - Redis for session storage
   - Cache frequently accessed boards
   - Cache user data and permissions

4. **CDN & Static Assets**
   - Serve frontend from CDN
   - Cache static assets
   - Optimize bundle size

5. **Monitoring**
   - Application Performance Monitoring (APM)
   - Error tracking (Sentry)
   - Log aggregation (ELK Stack)
   - Real-time metrics (Prometheus + Grafana)

## Performance Optimizations

### Backend
- Database query optimization with indexes
- Pagination for large datasets
- Lean queries to reduce payload size
- Connection pooling for MongoDB

### Frontend
- Code splitting with React.lazy
- Memoization with React.memo
- Debounced search input
- Virtual scrolling for large lists
- Image lazy loading
- Service workers for offline support

### Network
- Compression middleware (gzip)
- HTTP/2 for multiplexing
- WebSocket for reduced overhead
- Efficient JSON payloads

## Testing Strategy

### Unit Tests
- Controller logic
- Utility functions
- Model methods

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### End-to-End Tests
- User workflows
- Real-time synchronization
- Cross-browser compatibility

### Load Testing
- Concurrent users
- WebSocket connections
- Database performance

## Deployment Architecture

### Development
```
localhost:3000 (React Dev Server)
localhost:5000 (Express Server)
localhost:27017 (MongoDB Local)
```

### Production
```
CDN (Static Assets)
      ↓
Frontend (Vercel/Netlify)
      ↓
Backend (Heroku/Render/AWS)
      ↓
Database (MongoDB Atlas)
```

## Error Handling Strategy

### Backend
- Centralized error handler middleware
- Async error wrapper for controllers
- Mongoose error translation
- HTTP status codes
- Detailed error logging

### Frontend
- Error boundaries for React components
- API error interceptors
- User-friendly error messages
- Toast notifications
- Fallback UI

## Monitoring & Logging

### Recommended Tools
- **Application**: PM2, New Relic, DataDog
- **Errors**: Sentry, Rollbar
- **Logs**: Winston, Morgan, ELK Stack
- **Infrastructure**: AWS CloudWatch, Prometheus
- **Real-Time**: Socket.IO admin UI

### Key Metrics
- Response time
- Error rate
- Active WebSocket connections
- Database query performance
- Memory usage
- CPU utilization
