# API Routes Documentation

## Overview

This document describes all available API routes for the Simple Project Management application.

**Base URL (Production):** `https://simple-project-management-eggtikg63-francesca-tabors-projects.vercel.app`  
**Base URL (Local):** `http://localhost:3000`

---

## Authentication

All API routes (except `/api/health`) require authentication via Supabase Auth.

**Authentication Methods:**
- Cookie-based sessions (browser)
- Authorization header with JWT token (programmatic access)

**Unauthorized Response:**
```json
{
  "error": "Unauthorized"
}
```
**Status:** `401`

---

## Health Check

### `GET /api/health`

Check if the service is running and database is accessible.

**Authentication:** ❌ Not required  
**Rate Limiting:** None

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-03T12:00:00.000Z",
  "service": "simple-project-management",
  "version": "1.0.0",
  "uptime": {
    "responseTimeMs": 145
  },
  "checks": {
    "database": {
      "status": "ok"
    }
  }
}
```

**Status Codes:**
- `200` - Service is healthy

**Example:**
```bash
curl https://your-domain.vercel.app/api/health
```

---

## Tasks API

### `GET /api/tasks`

List all tasks for the authenticated user.

**Authentication:** ✅ Required

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Task title",
      "description": "Task description",
      "status": "pending",
      "priority": "medium",
      "dueDate": "2026-01-10",
      "labels": [],
      "checklist": [],
      "attachments": [],
      "assignee": null,
      "created_at": "2026-01-03T10:00:00Z",
      "updated_at": "2026-01-03T10:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Server error

---

### `POST /api/tasks`

Create a new task.

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "title": "New task",          // required
  "description": "Details",     // optional
  "status": "pending",          // optional, default: "pending"
  "priority": "high",           // optional, default: "medium"
  "dueDate": "2026-01-10"       // optional
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "New task",
    "status": "pending",
    ...
  }
}
```

**Status Codes:**
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized
- `500` - Server error

**Example:**
```bash
curl -X POST https://your-domain.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Complete project","priority":"high"}'
```

---

### `GET /api/tasks/:id`

Get a single task by ID.

**Authentication:** ✅ Required

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "title": "Task title",
    ...
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Task not found
- `500` - Server error

---

### `PUT /api/tasks/:id`

Update a task by ID.

**Authentication:** ✅ Required

**Request Body:** (all fields optional)
```json
{
  "title": "Updated title",
  "status": "in_progress",
  "priority": "urgent"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "title": "Updated title",
    ...
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request
- `401` - Unauthorized
- `404` - Task not found
- `500` - Server error

---

### `DELETE /api/tasks/:id`

Delete a task by ID.

**Authentication:** ✅ Required

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Task not found
- `500` - Server error

---

## Labels API

### `GET /api/labels`

List all labels for the authenticated user.

**Authentication:** ✅ Required

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "urgent",
      "color": "#EF4444",
      "created_at": "2026-01-03T10:00:00Z",
      "updated_at": "2026-01-03T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/labels`

Create a new label.

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "name": "urgent",      // required
  "color": "#EF4444"     // required (hex color)
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "urgent",
    "color": "#EF4444",
    ...
  }
}
```

**Status Codes:**
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `409` - Label with this name already exists
- `500` - Server error

---

### `PUT /api/labels/:id`

Update a label by ID.

**Authentication:** ✅ Required

**Request Body:** (all fields optional)
```json
{
  "name": "high-priority",
  "color": "#FF0000"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request
- `401` - Unauthorized
- `404` - Label not found
- `409` - Duplicate name
- `500` - Server error

---

### `DELETE /api/labels/:id`

Delete a label by ID.

**Authentication:** ✅ Required

**Note:** This will also remove all task-label associations for this label.

**Response:**
```json
{
  "message": "Label deleted successfully"
}
```

---

## Checklist Items API

### `GET /api/checklist-items?taskId=xxx`

List all checklist items for a specific task.

**Authentication:** ✅ Required

**Query Parameters:**
- `taskId` (required) - UUID of the task

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "task_id": "uuid",
      "text": "Complete documentation",
      "done": false,
      "order": 0,
      "created_at": "2026-01-03T10:00:00Z",
      "updated_at": "2026-01-03T10:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing taskId parameter
- `401` - Unauthorized
- `404` - Task not found
- `500` - Server error

---

### `POST /api/checklist-items`

Create a new checklist item.

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "task_id": "uuid",              // required
  "text": "Complete documentation", // required
  "done": false,                   // optional, default: false
  "order": 0                       // optional, auto-calculated if omitted
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "task_id": "uuid",
    "text": "Complete documentation",
    "done": false,
    "order": 0,
    ...
  }
}
```

**Status Codes:**
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `404` - Task not found
- `500` - Server error

---

### `PUT /api/checklist-items/:id`

Update a checklist item by ID.

**Authentication:** ✅ Required

**Request Body:** (all fields optional)
```json
{
  "text": "Updated text",
  "done": true,
  "order": 1
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request
- `401` - Unauthorized
- `404` - Checklist item not found
- `500` - Server error

---

### `DELETE /api/checklist-items/:id`

Delete a checklist item by ID.

**Authentication:** ✅ Required

**Response:**
```json
{
  "message": "Checklist item deleted successfully"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Checklist item not found
- `500` - Server error

---

## Error Responses

All API endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request succeeded |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid input or validation error |
| `401` | Unauthorized | Authentication required or failed |
| `403` | Forbidden | Authenticated but not authorized |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (e.g., label name) |
| `500` | Internal Server Error | Unexpected server error |

---

## Rate Limiting

Currently, there is no rate limiting on API routes. This may be added in the future.

---

## CORS

API routes support CORS for cross-origin requests. The `Access-Control-Allow-Origin` header is set based on your Vercel deployment configuration.

---

## Testing

### Health Check Test
```bash
curl https://your-domain.vercel.app/api/health
```

### Create Task Test (with auth)
```bash
curl -X POST https://your-domain.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"title":"Test task","priority":"high"}'
```

---

## Deployment

These API routes are deployed as Vercel Serverless Functions. Each route file corresponds to a serverless function endpoint.

**Functions:**
- `/api/health` → `app/api/health/route.ts`
- `/api/tasks` → `app/api/tasks/route.ts`
- `/api/tasks/[id]` → `app/api/tasks/[id]/route.ts`
- `/api/labels` → `app/api/labels/route.ts`
- `/api/labels/[id]` → `app/api/labels/[id]/route.ts`
- `/api/checklist-items` → `app/api/checklist-items/route.ts`
- `/api/checklist-items/[id]` → `app/api/checklist-items/[id]/route.ts`

---

## Future Enhancements

- [ ] Add pagination to GET endpoints
- [ ] Add filtering and sorting query parameters
- [ ] Add batch operations endpoints
- [ ] Add rate limiting
- [ ] Add API versioning (e.g., `/api/v1/tasks`)
- [ ] Add webhooks for task events
- [ ] Add OpenAPI/Swagger documentation

