# FR-093: Lernreise REST API Endpoints

**Status:** draft
**Priority:** must
**Created:** 2026-02-21

## Problem

The hoc-stage Python tool exposes a FastAPI-based REST API for course/module/task CRUD. The maindfull.LEARNING engine (Go/Echo) needs equivalent endpoints so that the maindset.ACADEMY frontend and admin console can manage Lernreise content programmatically without depending on a separate Python service.

## Solution

Add Lernreise management endpoints to the maindfull.LEARNING engine in `backend/internal/lernreise/handler.go`, integrated into the existing Echo router.

### API Endpoints

```
# Courses
GET    /api/v1/lernreise/courses                    — List all courses
GET    /api/v1/lernreise/courses/:courseId            — Get course details
POST   /api/v1/lernreise/courses                     — Create course
PUT    /api/v1/lernreise/courses/:courseId            — Update course
DELETE /api/v1/lernreise/courses/:courseId            — Delete course

# Modules
GET    /api/v1/lernreise/courses/:courseId/modules                — List modules
GET    /api/v1/lernreise/courses/:courseId/modules/:moduleId      — Get module
POST   /api/v1/lernreise/courses/:courseId/modules                — Create module
PUT    /api/v1/lernreise/modules/:moduleId                        — Update module
DELETE /api/v1/lernreise/modules/:moduleId                        — Delete module

# Tasks
GET    /api/v1/lernreise/modules/:moduleId/tasks             — List tasks
GET    /api/v1/lernreise/tasks/:taskId                        — Get task
POST   /api/v1/lernreise/modules/:moduleId/tasks             — Create task
PUT    /api/v1/lernreise/tasks/:taskId                        — Update task
DELETE /api/v1/lernreise/tasks/:taskId                        — Delete task

# Publishing
POST   /api/v1/lernreise/courses/:courseId/publish            — Publish to Firestore
POST   /api/v1/lernreise/courses/:courseId/unpublish          — Remove from Firestore
GET    /api/v1/lernreise/courses/:courseId/validate           — Validate course

# Memory Integration
GET    /api/v1/memory/items                                   — List synced items
POST   /api/v1/memory/sync                                    — Trigger sync
GET    /api/v1/memory/insights                                — List insights
POST   /api/v1/memory/insights/scan                           — Trigger insight scan
```

### Authentication & Authorization

- All endpoints require Firebase Auth token
- Course management: admin or trainer role
- Memory sync: admin role
- Read operations: authenticated users

## Acceptance Criteria

- [ ] All CRUD endpoints implemented for courses, modules, tasks
- [ ] Endpoints use shared Go models from `lernreise/models.go`
- [ ] Publish endpoint writes to Firestore `lernpfad_template` collection
- [ ] Validate endpoint runs all validation rules and returns errors
- [ ] Auth middleware enforces role-based access
- [ ] Memory endpoints trigger sync and return insights
- [ ] Request/response validation with proper HTTP status codes
- [ ] Unit tests for all handlers with mock dependencies
- [ ] Integration tests for Firestore publish flow

## Dependencies

- FR-089: Lernreise Content CLI Tool (shared models and logic)
- FR-090: ER1 Synchronization Service (memory endpoints)
- FR-092: Memory Insights Processor (insights endpoints)

## Notes

- Reuse existing Echo middleware (auth, rate limiting, logging)
- Follow existing maindfull.LEARNING API patterns (see `backend/internal/ai/handler.go`)
- OpenAPI spec to be generated from Go structs
- Consider pagination for list endpoints
