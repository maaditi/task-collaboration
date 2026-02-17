# API Contract Documentation

## Base URL
```
Production: https://your-backend-url.com/api
Development: http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

## Authentication Endpoints

### 1. Register User

**Endpoint**: `POST /auth/register`

**Access**: Public

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules**:
- name: Required, string, max 50 characters
- email: Required, valid email format, unique
- password: Required, minimum 6 characters

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "_id": "64abc123def456",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- 400: User already exists
- 400: Validation error
- 500: Server error

---

### 2. Login User

**Endpoint**: `POST /auth/login`

**Access**: Public

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "_id": "64abc123def456",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- 400: Email and password required
- 401: Invalid credentials
- 500: Server error

---

### 3. Get Current User

**Endpoint**: `GET /auth/me`

**Access**: Private (requires authentication)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "_id": "64abc123def456",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:
- 401: Not authorized
- 500: Server error

---

## Board Endpoints

### 1. Get All Boards

**Endpoint**: `GET /boards`

**Access**: Private

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by board title

**Example**: `GET /boards?page=1&limit=10&search=project`

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc123def456",
      "title": "Project Alpha",
      "description": "Main project board",
      "backgroundColor": "#0079bf",
      "owner": {
        "_id": "64user123",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": ""
      },
      "members": [
        {
          "_id": "64user123",
          "name": "John Doe",
          "email": "john@example.com",
          "avatar": ""
        },
        {
          "_id": "64user456",
          "name": "Jane Smith",
          "email": "jane@example.com",
          "avatar": ""
        }
      ],
      "isArchived": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### 2. Get Single Board

**Endpoint**: `GET /boards/:id`

**Access**: Private (must be owner or member)

**URL Parameters**:
- `id`: Board ID

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "_id": "64abc123def456",
    "title": "Project Alpha",
    "description": "Main project board",
    "backgroundColor": "#0079bf",
    "owner": {
      "_id": "64user123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [...],
    "isArchived": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:
- 404: Board not found
- 403: Not authorized to access this board
- 500: Server error

---

### 3. Create Board

**Endpoint**: `POST /boards`

**Access**: Private

**Request Body**:
```json
{
  "title": "New Project",
  "description": "Description here",
  "backgroundColor": "#0079bf"
}
```

**Validation Rules**:
- title: Required, string, max 100 characters
- description: Optional, string, max 500 characters
- backgroundColor: Optional, string (hex color)

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "_id": "64new123board",
    "title": "New Project",
    "description": "Description here",
    "backgroundColor": "#0079bf",
    "owner": {...},
    "members": [...],
    "isArchived": false,
    "createdAt": "2024-01-20T15:00:00.000Z",
    "updatedAt": "2024-01-20T15:00:00.000Z"
  }
}
```

---

### 4. Update Board

**Endpoint**: `PUT /boards/:id`

**Access**: Private (owner only)

**Request Body**:
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "backgroundColor": "#d29034"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": { /* updated board */ }
}
```

**Error Responses**:
- 404: Board not found
- 403: Not authorized to update this board
- 500: Server error

---

### 5. Delete Board

**Endpoint**: `DELETE /boards/:id`

**Access**: Private (owner only)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {}
}
```

**Note**: This also deletes all lists, tasks, and activities associated with the board.

---

### 6. Add Member to Board

**Endpoint**: `POST /boards/:id/members`

**Access**: Private (owner only)

**Request Body**:
```json
{
  "userId": "64user789abc"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": { /* updated board with new member */ }
}
```

---

## List Endpoints

### 1. Get Lists for Board

**Endpoint**: `GET /boards/:boardId/lists`

**Access**: Private

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64list123",
      "title": "To Do",
      "board": "64abc123def456",
      "position": 0,
      "isArchived": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "64list456",
      "title": "In Progress",
      "board": "64abc123def456",
      "position": 1,
      "isArchived": false,
      "createdAt": "2024-01-15T10:35:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

---

### 2. Create List

**Endpoint**: `POST /boards/:boardId/lists`

**Access**: Private

**Request Body**:
```json
{
  "title": "Done"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "_id": "64list789",
    "title": "Done",
    "board": "64abc123def456",
    "position": 2,
    "isArchived": false,
    "createdAt": "2024-01-20T15:00:00.000Z",
    "updatedAt": "2024-01-20T15:00:00.000Z"
  }
}
```

---

### 3. Update List

**Endpoint**: `PUT /lists/:id`

**Access**: Private

**Request Body**:
```json
{
  "title": "Updated Title",
  "position": 1
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": { /* updated list */ }
}
```

---

### 4. Delete List

**Endpoint**: `DELETE /lists/:id`

**Access**: Private

**Success Response (200)**:
```json
{
  "success": true,
  "data": {}
}
```

**Note**: This also deletes all tasks in the list.

---

## Task Endpoints

### 1. Get Tasks for List

**Endpoint**: `GET /lists/:listId/tasks`

**Access**: Private

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search by task title

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64task123",
      "title": "Implement login feature",
      "description": "Create login page with validation",
      "list": "64list123",
      "board": "64abc123def456",
      "assignedTo": [
        {
          "_id": "64user123",
          "name": "John Doe",
          "email": "john@example.com"
        }
      ],
      "position": 0,
      "priority": "high",
      "dueDate": "2024-01-25T00:00:00.000Z",
      "labels": ["frontend", "urgent"],
      "isArchived": false,
      "createdBy": {
        "_id": "64user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15,
    "pages": 1
  }
}
```

---

### 2. Get All Tasks for Board

**Endpoint**: `GET /boards/:boardId/tasks`

**Access**: Private

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    /* array of all tasks in the board */
  ]
}
```

---

### 3. Create Task

**Endpoint**: `POST /lists/:listId/tasks`

**Access**: Private

**Request Body**:
```json
{
  "title": "New Task",
  "description": "Task description here",
  "priority": "medium",
  "dueDate": "2024-02-01T00:00:00.000Z",
  "labels": ["backend", "api"],
  "assignedTo": ["64user123", "64user456"]
}
```

**Validation Rules**:
- title: Required, string, max 200 characters
- description: Optional, string, max 2000 characters
- priority: Optional, enum: [low, medium, high, urgent]
- dueDate: Optional, valid date
- labels: Optional, array of strings
- assignedTo: Optional, array of user IDs

**Success Response (201)**:
```json
{
  "success": true,
  "data": { /* created task with populated fields */ }
}
```

---

### 4. Update Task

**Endpoint**: `PUT /tasks/:id`

**Access**: Private

**Request Body** (all fields optional):
```json
{
  "title": "Updated Task Title",
  "description": "Updated description",
  "priority": "urgent",
  "dueDate": "2024-02-15T00:00:00.000Z",
  "labels": ["backend", "api", "critical"],
  "assignedTo": ["64user123"]
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": { /* updated task */ }
}
```

---

### 5. Move Task

**Endpoint**: `PUT /tasks/:id/move`

**Access**: Private

**Request Body**:
```json
{
  "listId": "64list456",
  "position": 2
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": { /* moved task */ }
}
```

---

### 6. Delete Task

**Endpoint**: `DELETE /tasks/:id`

**Access**: Private

**Success Response (200)**:
```json
{
  "success": true,
  "data": {}
}
```

---

## Activity Endpoints

### 1. Get Board Activities

**Endpoint**: `GET /boards/:boardId/activities`

**Access**: Private

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64activity123",
      "board": "64abc123def456",
      "user": {
        "_id": "64user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "action": "create_task",
      "targetType": "Task",
      "targetId": "64task123",
      "details": {
        "title": "New Task",
        "listId": "64list123"
      },
      "createdAt": "2024-01-20T15:30:00.000Z",
      "updatedAt": "2024-01-20T15:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**Activity Action Types**:
- `create_board`
- `update_board`
- `delete_board`
- `create_list`
- `update_list`
- `delete_list`
- `create_task`
- `update_task`
- `delete_task`
- `move_task`
- `assign_user`
- `unassign_user`
- `add_member`
- `remove_member`

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation error or malformed request |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP address
- **Response Header**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

Rate limit exceeded response:
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

---

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000', {
  transports: ['websocket']
});
```

### Events to Emit (Client → Server)

1. **join-board**
```javascript
socket.emit('join-board', boardId);
```

2. **leave-board**
```javascript
socket.emit('leave-board', boardId);
```

3. **board-updated**
```javascript
socket.emit('board-updated', {
  boardId: '64abc123',
  board: { /* updated board data */ }
});
```

4. **list-created**
```javascript
socket.emit('list-created', {
  boardId: '64abc123',
  list: { /* new list data */ }
});
```

5. **task-created**
```javascript
socket.emit('task-created', {
  boardId: '64abc123',
  task: { /* new task data */ }
});
```

6. **task-moved**
```javascript
socket.emit('task-moved', {
  boardId: '64abc123',
  taskId: '64task123',
  from: '64list123',
  to: '64list456'
});
```

### Events to Listen (Server → Client)

Listen for same event names:
```javascript
socket.on('list-created', (data) => {
  console.log('New list created:', data.list);
  // Update UI
});

socket.on('task-moved', (data) => {
  console.log('Task moved:', data);
  // Update UI
});
```

---

## Example Usage with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create Board
```bash
curl -X POST http://localhost:5000/api/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "My Project",
    "description": "Project description"
  }'
```

### Create Task
```bash
curl -X POST http://localhost:5000/api/lists/LIST_ID/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "New Task",
    "description": "Task details",
    "priority": "high"
  }'
```

This API contract provides a complete reference for all available endpoints and their usage.
