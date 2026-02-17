# Database Schema Design

## Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                     │
├─────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                              │
│ name: String (required, max: 50)                                │
│ email: String (required, unique, lowercase)                     │
│ password: String (required, hashed, min: 6)                     │
│ avatar: String                                                  │
│ isActive: Boolean (default: true)                               │
│ createdAt: Date                                                 │
│ updatedAt: Date                                                 │
│                                                                 │
│ Indexes:                                                        │
│ - email (unique)                                                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ owns/member of (1:N / N:M)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BOARD                                    │
├─────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                              │
│ title: String (required, max: 100)                              │
│ description: String (max: 500)                                  │
│ owner: ObjectId (FK → User, required)                           │
│ members: [ObjectId] (FK → User)                                 │
│ backgroundColor: String (default: "#0079bf")                    │
│ isArchived: Boolean (default: false)                            │
│ createdAt: Date                                                 │
│ updatedAt: Date                                                 │
│                                                                 │
│ Indexes:                                                        │
│ - owner + createdAt (compound)                                  │
│ - members + createdAt (compound)                                │
│ - isArchived                                                    │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ contains (1:N)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         LIST                                     │
├─────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                              │
│ title: String (required, max: 100)                              │
│ board: ObjectId (FK → Board, required)                          │
│ position: Number (required, default: 0)                         │
│ isArchived: Boolean (default: false)                            │
│ createdAt: Date                                                 │
│ updatedAt: Date                                                 │
│                                                                 │
│ Indexes:                                                        │
│ - board + position (compound)                                   │
│ - board + isArchived (compound)                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ contains (1:N)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         TASK                                     │
├─────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                              │
│ title: String (required, max: 200)                              │
│ description: String (max: 2000)                                 │
│ list: ObjectId (FK → List, required)                            │
│ board: ObjectId (FK → Board, required)                          │
│ assignedTo: [ObjectId] (FK → User)                              │
│ position: Number (required, default: 0)                         │
│ priority: String (enum: low/medium/high/urgent)                 │
│ dueDate: Date                                                   │
│ labels: [String]                                                │
│ isArchived: Boolean (default: false)                            │
│ createdBy: ObjectId (FK → User, required)                       │
│ createdAt: Date                                                 │
│ updatedAt: Date                                                 │
│                                                                 │
│ Indexes:                                                        │
│ - list + position (compound)                                    │
│ - board + isArchived (compound)                                 │
│ - assignedTo (multikey)                                         │
│ - createdAt (descending)                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       ACTIVITY                                   │
├─────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                              │
│ board: ObjectId (FK → Board, required)                          │
│ user: ObjectId (FK → User, required)                            │
│ action: String (enum: create_board, update_board, etc.)         │
│ targetType: String (enum: Board, List, Task)                    │
│ targetId: ObjectId (required)                                   │
│ details: Mixed (JSON object)                                    │
│ createdAt: Date                                                 │
│ updatedAt: Date                                                 │
│                                                                 │
│ Indexes:                                                        │
│ - board + createdAt (compound, descending)                      │
│ - user + createdAt (compound, descending)                       │
└─────────────────────────────────────────────────────────────────┘
```

## Relationship Diagram

```
         User
           │
           ├──owns──────────────────► Board
           │                            │
           ├──member of (N:M)──────────┤
           │                            │
           │                            ├──contains──► List
           │                            │               │
           │                            │               ├──contains──► Task
           │                            │               │               │
           ├──assigned to (N:M)────────┼───────────────┼───────────────┤
           │                            │               │               │
           └──performs──────────────────┼───────────────┼──► Activity  │
                                        │               │               │
                                        └───references──┴───────────────┘
```

## Field Details

### User Schema

| Field | Type | Required | Unique | Default | Validation |
|-------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | MongoDB |
| name | String | Yes | No | - | max: 50 chars |
| email | String | Yes | Yes | - | Valid email format, lowercase |
| password | String | Yes | No | - | min: 6 chars, bcrypt hashed |
| avatar | String | No | No | "" | URL or empty |
| isActive | Boolean | No | No | true | - |
| createdAt | Date | Auto | No | Auto | - |
| updatedAt | Date | Auto | No | Auto | - |

**Purpose**: Stores user account information and authentication credentials.

---

### Board Schema

| Field | Type | Required | Unique | Default | Validation |
|-------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | MongoDB |
| title | String | Yes | No | - | max: 100 chars |
| description | String | No | No | - | max: 500 chars |
| owner | ObjectId | Yes | No | - | Valid User ID |
| members | [ObjectId] | No | No | [owner] | Valid User IDs |
| backgroundColor | String | No | No | "#0079bf" | Hex color code |
| isArchived | Boolean | No | No | false | - |
| createdAt | Date | Auto | No | Auto | - |
| updatedAt | Date | Auto | No | Auto | - |

**Purpose**: Represents a project board containing multiple lists.

---

### List Schema

| Field | Type | Required | Unique | Default | Validation |
|-------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | MongoDB |
| title | String | Yes | No | - | max: 100 chars |
| board | ObjectId | Yes | No | - | Valid Board ID |
| position | Number | Yes | No | 0 | Non-negative integer |
| isArchived | Boolean | No | No | false | - |
| createdAt | Date | Auto | No | Auto | - |
| updatedAt | Date | Auto | No | Auto | - |

**Purpose**: Represents a column/list within a board containing tasks.

---

### Task Schema

| Field | Type | Required | Unique | Default | Validation |
|-------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | MongoDB |
| title | String | Yes | No | - | max: 200 chars |
| description | String | No | No | - | max: 2000 chars |
| list | ObjectId | Yes | No | - | Valid List ID |
| board | ObjectId | Yes | No | - | Valid Board ID |
| assignedTo | [ObjectId] | No | No | [] | Valid User IDs |
| position | Number | Yes | No | 0 | Non-negative integer |
| priority | String | No | No | "medium" | low/medium/high/urgent |
| dueDate | Date | No | No | null | Valid future date |
| labels | [String] | No | No | [] | Array of strings |
| isArchived | Boolean | No | No | false | - |
| createdBy | ObjectId | Yes | No | - | Valid User ID |
| createdAt | Date | Auto | No | Auto | - |
| updatedAt | Date | Auto | No | Auto | - |

**Purpose**: Represents individual tasks/cards within lists.

---

### Activity Schema

| Field | Type | Required | Unique | Default | Validation |
|-------|------|----------|--------|---------|------------|
| _id | ObjectId | Yes | Yes | Auto | MongoDB |
| board | ObjectId | Yes | No | - | Valid Board ID |
| user | ObjectId | Yes | No | - | Valid User ID |
| action | String | Yes | No | - | Predefined action types |
| targetType | String | Yes | No | - | Board/List/Task |
| targetId | ObjectId | Yes | No | - | Valid entity ID |
| details | Mixed | No | No | {} | JSON object |
| createdAt | Date | Auto | No | Auto | - |
| updatedAt | Date | Auto | No | Auto | - |

**Purpose**: Tracks all actions performed on boards for activity history.

**Action Types**:
- Board: `create_board`, `update_board`, `delete_board`, `add_member`, `remove_member`
- List: `create_list`, `update_list`, `delete_list`
- Task: `create_task`, `update_task`, `delete_task`, `move_task`, `assign_user`, `unassign_user`

---

## Index Strategy

### Why Indexes Matter
Indexes dramatically improve query performance by allowing MongoDB to quickly locate documents without scanning entire collections.

### User Collection
```javascript
{ email: 1 }  // Unique index for fast login lookups
```

### Board Collection
```javascript
{ owner: 1, createdAt: -1 }     // User's own boards, newest first
{ members: 1, createdAt: -1 }   // Shared boards, newest first
{ isArchived: 1 }               // Filter archived boards
```

### List Collection
```javascript
{ board: 1, position: 1 }       // Lists in order for a board
{ board: 1, isArchived: 1 }     // Active lists for a board
```

### Task Collection
```javascript
{ list: 1, position: 1 }        // Tasks in order for a list
{ board: 1, isArchived: 1 }     // All tasks for a board
{ assignedTo: 1 }               // Find tasks assigned to user (multikey)
{ createdAt: -1 }               // Recent tasks
```

### Activity Collection
```javascript
{ board: 1, createdAt: -1 }     // Board activity history, newest first
{ user: 1, createdAt: -1 }      // User's activity history
```

---

## Query Performance Examples

### Optimized Queries

**Get user's boards (uses index: owner + createdAt)**
```javascript
Board.find({ owner: userId }).sort({ createdAt: -1 })
```

**Get lists for a board (uses index: board + position)**
```javascript
List.find({ board: boardId, isArchived: false }).sort({ position: 1 })
```

**Get tasks for a list (uses index: list + position)**
```javascript
Task.find({ list: listId }).sort({ position: 1 })
```

**Get user's assigned tasks (uses index: assignedTo)**
```javascript
Task.find({ assignedTo: userId })
```

**Get recent board activity (uses index: board + createdAt)**
```javascript
Activity.find({ board: boardId }).sort({ createdAt: -1 }).limit(20)
```

---

## Data Integrity Rules

### Cascading Deletes
When deleting entities, related data must also be removed:

1. **Delete Board**:
   - Delete all Lists in board
   - Delete all Tasks in board
   - Delete all Activities for board

2. **Delete List**:
   - Delete all Tasks in list

3. **Delete User** (if implemented):
   - Transfer or delete owned boards
   - Remove from board members
   - Remove from task assignments

### Referential Integrity
- All foreign keys (ObjectId references) must point to existing documents
- Orphaned references should be prevented or cleaned up

---

## Sample Data

### User Document
```json
{
  "_id": ObjectId("64abc123def456789"),
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$hashed_password_here",
  "avatar": "https://example.com/avatar.jpg",
  "isActive": true,
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

### Board Document
```json
{
  "_id": ObjectId("64board123456"),
  "title": "Project Alpha",
  "description": "Main development board",
  "owner": ObjectId("64abc123def456789"),
  "members": [
    ObjectId("64abc123def456789"),
    ObjectId("64user456789abc")
  ],
  "backgroundColor": "#0079bf",
  "isArchived": false,
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

### List Document
```json
{
  "_id": ObjectId("64list123456"),
  "title": "To Do",
  "board": ObjectId("64board123456"),
  "position": 0,
  "isArchived": false,
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

### Task Document
```json
{
  "_id": ObjectId("64task123456"),
  "title": "Implement authentication",
  "description": "Add JWT-based authentication to the API",
  "list": ObjectId("64list123456"),
  "board": ObjectId("64board123456"),
  "assignedTo": [
    ObjectId("64abc123def456789")
  ],
  "position": 0,
  "priority": "high",
  "dueDate": ISODate("2024-01-25T00:00:00Z"),
  "labels": ["backend", "security"],
  "isArchived": false,
  "createdBy": ObjectId("64abc123def456789"),
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-20T14:30:00Z")
}
```

### Activity Document
```json
{
  "_id": ObjectId("64activity123"),
  "board": ObjectId("64board123456"),
  "user": ObjectId("64abc123def456789"),
  "action": "create_task",
  "targetType": "Task",
  "targetId": ObjectId("64task123456"),
  "details": {
    "title": "Implement authentication",
    "listId": ObjectId("64list123456")
  },
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

---

## MongoDB Shell Commands

### Create Collections with Validation
```javascript
// User collection
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      required: ["name", "email", "password"],
      properties: {
        name: { bsonType: "string", maxLength: 50 },
        email: { bsonType: "string", pattern: "^\\w+@\\w+\\.\\w+$" },
        password: { bsonType: "string", minLength: 6 }
      }
    }
  }
})

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.boards.createIndex({ owner: 1, createdAt: -1 })
db.boards.createIndex({ members: 1, createdAt: -1 })
db.lists.createIndex({ board: 1, position: 1 })
db.tasks.createIndex({ list: 1, position: 1 })
db.tasks.createIndex({ assignedTo: 1 })
db.activities.createIndex({ board: 1, createdAt: -1 })
```

### Query Examples
```javascript
// Find all boards for a user (owner or member)
db.boards.find({
  $or: [
    { owner: ObjectId("user_id") },
    { members: ObjectId("user_id") }
  ]
})

// Find tasks with high priority due this week
db.tasks.find({
  priority: "high",
  dueDate: {
    $gte: new Date(),
    $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
})

// Find recent activities for a board
db.activities.find({ board: ObjectId("board_id") })
  .sort({ createdAt: -1 })
  .limit(20)
```

This schema design ensures efficient data access, maintains referential integrity, and supports all required features of the application.
