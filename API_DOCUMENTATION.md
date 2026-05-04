# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All endpoints (except `/auth/login`) require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Auth Endpoints

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@university.edu",
  "password": "password123"
}

Response 200:
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "admin@university.edu",
    "name": "Admin User",
    "role": "Admin",
    "facultyId": null
  }
}
```

### Get Current User
```http
GET /auth/me

Response 200:
{
  "id": "uuid",
  "email": "user@university.edu",
  "role": "Scheduler",
  "name": "John Doe",
  "faculty_id": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Logout
```http
POST /auth/logout

Response 200:
{}
```

## Department Endpoints

### Get All Departments
```http
GET /departments

Response 200:
[
  {
    "id": "uuid",
    "name": "Computer Science",
    "code": "CS",
    "head": "Dr. John Smith",
    "description": "Department of Computer Science",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Get Department by ID
```http
GET /departments/{id}

Response 200:
{
  "id": "uuid",
  "name": "Computer Science",
  "code": "CS",
  "head": "Dr. John Smith",
  "description": "Department of Computer Science"
}
```

### Create Department (Admin/Scheduler only)
```http
POST /departments
Content-Type: application/json

{
  "name": "Computer Science",
  "code": "CS",
  "head": "Dr. John Smith",
  "description": "Department of Computer Science"
}

Response 201:
{
  "id": "uuid",
  "name": "Computer Science",
  ...
}
```

### Update Department
```http
PUT /departments/{id}
Content-Type: application/json

{
  "name": "Computer Science",
  "code": "CS",
  "head": "Dr. Jane Doe",
  "description": "Updated description"
}

Response 200:
{ updated department }
```

### Delete Department (Admin only)
```http
DELETE /departments/{id}

Response 200:
{ "message": "Department deleted" }
```

## Programme Endpoints

### Get All Programmes
```http
GET /programmes

Response 200:
[
  {
    "id": "uuid",
    "name": "BSc Computer Science",
    "code": "BSCS101",
    "dept_id": "uuid",
    "group_label": "A1",
    "start_date": "2024-01-15",
    "end_date": "2024-05-15",
    "total_weeks": 17,
    "allotted_hours": 680,
    "status": "Active",
    "notes": "Spring semester",
    "departments": {
      "name": "Computer Science",
      "code": "CS"
    }
  }
]
```

### Get Programme with Modules
```http
GET /programmes/{id}

Response 200:
{
  "id": "uuid",
  "name": "BSc Computer Science",
  "code": "BSCS101",
  "programme_modules": [
    {
      "id": "uuid",
      "programme_id": "uuid",
      "module_id": "uuid",
      "allocated_hours": 40,
      "weekly_target_hours": 4,
      "hours_scheduled": 16,
      "modules": {
        "id": "uuid",
        "name": "Data Structures",
        "code": "CS301",
        "level": "Level 3"
      }
    }
  ]
}
```

### Create Programme
```http
POST /programmes
Content-Type: application/json

{
  "name": "BSc Computer Science",
  "code": "BSCS101",
  "dept_id": "uuid",
  "group_label": "A1",
  "start_date": "2024-01-15",
  "end_date": "2024-05-15",
  "total_weeks": 17,
  "allotted_hours": 680,
  "status": "Active",
  "notes": "Spring semester"
}

Response 201:
{ created programme }
```

### Clone Programme
```http
POST /programmes/{id}/clone

Response 201:
{
  "id": "new_uuid",
  "name": "BSc Computer Science (Clone)",
  "code": "BSCS101_CLONE_1234567890",
  ...
}
```

### Update & Delete
```http
PUT /programmes/{id}
DELETE /programmes/{id}
```

## Module Endpoints

### Get All Modules
```http
GET /modules

Response 200:
[
  {
    "id": "uuid",
    "name": "Data Structures",
    "code": "CS301",
    "level": "Level 3",
    "default_hours": 40,
    "type": "Lecture",
    "description": "Fundamental data structures",
    "is_shared": false
  }
]
```

### Create Module
```http
POST /modules
Content-Type: application/json

{
  "name": "Data Structures",
  "code": "CS301",
  "level": "Level 3",
  "default_hours": 40,
  "type": "Lecture",
  "description": "Fundamental data structures",
  "is_shared": false
}

Response 201:
{ created module }
```

## Programme-Module Endpoints

### Get Programme Modules
```http
GET /programme-modules/programme/{programmeId}

Response 200:
[
  {
    "id": "uuid",
    "programme_id": "uuid",
    "module_id": "uuid",
    "allocated_hours": 40,
    "weekly_target_hours": 4,
    "hours_scheduled": 16,
    "modules": { ... }
  }
]
```

### Add Module to Programme
```http
POST /programme-modules
Content-Type: application/json

{
  "programme_id": "uuid",
  "module_id": "uuid",
  "allocated_hours": 40,
  "weekly_target_hours": 4
}

Response 201:
{ created assignment }
```

### Update Module Assignment
```http
PUT /programme-modules/{id}
Content-Type: application/json

{
  "allocated_hours": 50,
  "weekly_target_hours": 5
}

Response 200:
{ updated assignment }
```

## Faculty Endpoints

### Get All Faculty
```http
GET /faculty

Response 200:
[
  {
    "id": "uuid",
    "name": "Dr. John Smith",
    "staff_id": "CS001",
    "dept_id": "uuid",
    "qualification_level": "Level 5",
    "max_weekly_hours": 40,
    "email": "john@university.edu",
    "phone": "+1234567890",
    "status": "Active",
    "notes": ""
  }
]
```

### Get Faculty with Availability
```http
GET /faculty/{id}

Response 200:
{
  "id": "uuid",
  "name": "Dr. John Smith",
  "staff_id": "CS001",
  "qualification_level": "Level 5",
  "max_weekly_hours": 40,
  "faculty_availability": [
    {
      "id": "uuid",
      "faculty_id": "uuid",
      "day_of_week": 0,
      "start_time": "09:00",
      "end_time": "17:00"
    }
  ],
  "faculty_leave": [
    {
      "id": "uuid",
      "faculty_id": "uuid",
      "leave_date": "2024-03-15",
      "reason": "Conference"
    }
  ]
}
```

### Create Faculty
```http
POST /faculty
Content-Type: application/json

{
  "name": "Dr. John Smith",
  "staff_id": "CS001",
  "dept_id": "uuid",
  "qualification_level": "Level 5",
  "max_weekly_hours": 40,
  "email": "john@university.edu",
  "phone": "+1234567890",
  "status": "Active",
  "notes": ""
}

Response 201:
{ created faculty }
```

### Add Availability
```http
POST /faculty/{id}/availability
Content-Type: application/json

{
  "day_of_week": 0,
  "start_time": "09:00",
  "end_time": "17:00"
}

Response 201:
{ created availability }
```

### Add Leave
```http
POST /faculty/{id}/leave
Content-Type: application/json

{
  "leave_date": "2024-03-15",
  "reason": "Conference"
}

Response 201:
{ created leave }
```

## Room Endpoints

### Get All Rooms
```http
GET /rooms

Response 200:
[
  {
    "id": "uuid",
    "name": "Lecture Hall A",
    "code": "LHA",
    "capacity": 100,
    "type": "Lecture Hall",
    "floor": "Ground",
    "building": "Science Building",
    "notes": ""
  }
]
```

### Create Room
```http
POST /rooms
Content-Type: application/json

{
  "name": "Lecture Hall A",
  "code": "LHA",
  "capacity": 100,
  "type": "Lecture Hall",
  "floor": "Ground",
  "building": "Science Building",
  "notes": ""
}

Response 201:
{ created room }
```

## Session Endpoints

### Get Sessions
```http
GET /sessions?programme_id=uuid&faculty_id=uuid&start_date=2024-01-15&end_date=2024-01-22

Response 200:
[
  {
    "id": "uuid",
    "programme_id": "uuid",
    "module_id": "uuid",
    "faculty_id": "uuid",
    "room_id": "uuid",
    "session_date": "2024-01-15",
    "start_time": "09:00",
    "duration_hours": 2,
    "session_type": "Lecture",
    "is_extra": false,
    "is_locked": false,
    "notes": "",
    "programmes": { "name": "BSc CS", "code": "BSCS" },
    "modules": { "name": "Data Structures", "code": "CS301" },
    "faculty": { "name": "Dr. John Smith" },
    "rooms": { "name": "Lecture Hall A", "code": "LHA" }
  }
]
```

### Create Session (with Conflict Check)
```http
POST /sessions
Content-Type: application/json

{
  "programme_id": "uuid",
  "module_id": "uuid",
  "faculty_id": "uuid",
  "room_id": "uuid",
  "session_date": "2024-01-15",
  "start_time": "09:00",
  "duration_hours": 2,
  "session_type": "Lecture",
  "is_extra": false,
  "notes": ""
}

Response 201:
{ created session }

Response 400 (Hard Conflicts):
{
  "error": "Hard conflicts detected",
  "conflicts": [
    "Faculty double-booked at this time",
    "Room already booked at this time"
  ]
}
```

### Update Session
```http
PUT /sessions/{id}
Content-Type: application/json

{
  "session_date": "2024-01-16",
  "start_time": "10:00",
  "duration_hours": 2,
  "is_locked": false,
  "notes": ""
}

Response 200:
{ updated session }
```

## Conflict Endpoints

### Get Conflicts
```http
GET /conflicts?severity=Hard&type=Faculty Double-Booking&start_date=2024-01-01

Response 200:
[
  {
    "id": "uuid",
    "session_id": "uuid",
    "conflict_type": "Faculty Double-Booking",
    "severity": "Hard",
    "description": "Faculty is scheduled at overlapping time",
    "override_reason": null,
    "resolved_by": null,
    "created_at": "2024-01-15T09:00:00Z"
  }
]
```

### Resolve Conflict
```http
PUT /conflicts/{id}/resolve
Content-Type: application/json

{
  "override_reason": "Rescheduled faculty - approved by department head"
}

Response 200:
{ updated conflict }
```

## Reports Endpoints

### Faculty Report
```http
GET /reports/faculty/{facultyId}?start_date=2024-01-01&end_date=2024-01-31

Response 200:
{
  "sessions": [ ... ],
  "leave": [ ... ],
  "total_hours": 40
}
```

### Programme Report
```http
GET /reports/programme/{programmeId}

Response 200:
{
  "programme": { ... },
  "total_sessions": 15,
  "total_hours_scheduled": 60,
  "sessions": [ ... ]
}
```

### Module Report
```http
GET /reports/module/{moduleId}

Response 200:
{
  "programmes": [ ... ],
  "total_sessions": 10,
  "total_hours": 20
}
```

### Room Utilization
```http
GET /reports/room/utilization/{roomId}?start_date=2024-01-01&end_date=2024-01-31

Response 200:
{
  "total_sessions": 20,
  "total_hours": 40,
  "sessions": [ ... ]
}
```

## Audit Log Endpoints

### Get Audit Log (Admin/Scheduler only)
```http
GET /audit?entity_type=session&action=create&start_date=2024-01-01

Response 200:
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "action": "create",
    "entity_type": "session",
    "entity_id": "uuid",
    "entity_name": "Data Structures - 2024-01-15",
    "old_value": null,
    "new_value": { "session_date": "2024-01-15", ... },
    "timestamp": "2024-01-15T09:00:00Z"
  }
]
```

## Error Responses

### 400 - Bad Request
```json
{
  "error": "Invalid input parameters"
}
```

### 401 - Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 - Forbidden
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

### 500 - Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

Currently no rate limiting. Implement in production using express-rate-limit.

## Pagination

Add to any GET endpoint:
```
?page=1&limit=20
```

## Filtering

Apply filters using query parameters:
```
GET /sessions?faculty_id=uuid&status=completed&start_date=2024-01-01
```
