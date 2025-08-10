# TestSchool Assessment Platform - API Documentation

## Table of Contents

- [Authentication](#authentication)
- [Question Management API](#question-management-api)
- [Assessment API (One Question at a Time)](#assessment-api-one-question-at-a-time)
- [Error Responses](#error-responses)
- [Response Formats](#response-formats)

---

## Authentication

All API endpoints require authentication via JWT Bearer token:

```http
Authorization: Bearer <your_jwt_token>
```

### Roles & Permissions

- **Admin**: Full access to question management
- **Student**: Access to assessments only
- **Supervisor**: Currently same as admin

---

## Question Management API

Base URL: `/api/v1/questions`

**Required Role**: Admin only

### 1. Create Question

**POST** `/api/v1/questions`

Creates a new question for the assessment system.

#### Request Body

```json
{
  "competencyId": "string", // Required: MongoDB ObjectId of competency
  "level": "A1|A2|B1|B2|C1|C2", // Required: Competency level
  "questionText": "string", // Required: The question text
  "options": ["string"], // Required: Array of exactly 4 options
  "correctOptionIndex": 0, // Required: Index (0-3) of correct answer
  "difficulty": 3 // Optional: Difficulty level 1-5 (default: 3)
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Question created successfully",
  "data": {
    "question": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "competencyId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "level": "A1",
      "questionText": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctOptionIndex": 2,
      "difficulty": 3,
      "isActive": true,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

### 2. Get Questions (with filtering)

**GET** `/api/v1/questions`

Retrieves questions with optional filtering and pagination.

#### Query Parameters

- `competencyId` (optional): Filter by competency ID
- `level` (optional): Filter by level (A1, A2, B1, B2, C1, C2)
- `step` (optional): Filter by assessment step (1, 2, 3)
- `isActive` (optional): Filter by active status (default: true)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

#### Example Request

```http
GET /api/v1/questions?level=A1&isActive=true&page=1&limit=10
```

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Questions retrieved successfully",
  "data": {
    "questions": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "competencyId": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": "Listening Comprehension"
        },
        "level": "A1",
        "questionText": "What is the capital of France?",
        "options": ["London", "Berlin", "Paris", "Madrid"],
        "correctOptionIndex": 2,
        "difficulty": 3,
        "isActive": true,
        "createdAt": "2024-01-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 42,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 3. Get Question by ID

**GET** `/api/v1/questions/:id`

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Question retrieved successfully",
  "data": {
    "question": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "competencyId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Listening Comprehension"
      },
      "level": "A1",
      "questionText": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctOptionIndex": 2,
      "difficulty": 3,
      "isActive": true
    }
  }
}
```

### 4. Update Question

**PUT** `/api/v1/questions/:id`

#### Request Body (all fields optional)

```json
{
  "questionText": "string",
  "options": ["string"],
  "correctOptionIndex": 0,
  "difficulty": 3,
  "isActive": true
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Question updated successfully",
  "data": {
    "question": {
      // Updated question object
    }
  }
}
```

### 5. Delete Question (Soft Delete)

**DELETE** `/api/v1/questions/:id`

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Question deleted successfully"
}
```

### 6. Get Questions for Assessment Step

**GET** `/api/v1/questions/step/:step`

Retrieves 44 questions for a specific assessment step with proper level distribution.

#### Parameters

- `step`: Assessment step (1, 2, or 3)
- `randomize`: Query parameter (default: true) - whether to randomize questions

#### Example Request

```http
GET /api/v1/questions/step/1?randomize=true
```

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Questions for Step 1 retrieved successfully",
  "data": {
    "step": 1,
    "levels": ["A1", "A2"],
    "totalQuestions": 44,
    "questions": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "competencyId": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": "Listening Comprehension"
        },
        "level": "A1",
        "questionText": "What is the capital of France?",
        "options": ["London", "Berlin", "Paris", "Madrid"],
        "correctOptionIndex": 2
      }
      // ... 43 more questions
    ]
  }
}
```

### 7. Get Assessment Completion Status

**GET** `/api/v1/questions/assessment/status`

Check if the question pool is ready for assessments.

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Assessment completion status retrieved",
  "data": {
    "totalCompetencies": 22,
    "requiredQuestionsTotal": 132,
    "totalQuestionsAvailable": 128,
    "overallCompletion": 97,
    "stepStatus": [
      {
        "step": 1,
        "levels": ["A1", "A2"],
        "questionsRequired": 44,
        "questionsAvailable": 44,
        "isReady": true,
        "completion": 100
      },
      {
        "step": 2,
        "levels": ["B1", "B2"],
        "questionsRequired": 44,
        "questionsAvailable": 42,
        "isReady": false,
        "completion": 95
      },
      {
        "step": 3,
        "levels": ["C1", "C2"],
        "questionsRequired": 44,
        "questionsAvailable": 42,
        "isReady": false,
        "completion": 95
      }
    ]
  }
}
```

---

## Assessment API (One Question at a Time)

Base URL: `/api/v1/assessments`

**Required Role**: Student only

### 1. Check Eligibility

**GET** `/api/v1/assessments/eligibility/:step`

Check if user is eligible to take a specific assessment step.

#### Parameters

- `step`: Assessment step (1, 2, or 3)

#### Example Request

```http
GET /api/v1/assessments/eligibility/1
```

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User eligible for Step 1",
  "data": {
    "eligible": true,
    "step": 1,
    "currentLevel": null
  }
}
```

#### Response (403 Forbidden) - Blocked User

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Assessment access blocked due to Step 1 failure (<25%)"
}
```

### 2. Start Assessment

**POST** `/api/v1/assessments/start`

Start a new assessment for the authenticated user.

#### Request Body

```json
{
  "step": 1 // Required: Assessment step (1, 2, or 3)
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Assessment started successfully",
  "data": {
    "testId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "currentQuestionIndex": 0,
    "totalQuestions": 44
  }
}
```

#### Response (409 Conflict) - Already Active

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Assessment for Step 1 already in progress"
}
```

### 3. Get Current Question

**GET** `/api/v1/assessments/:testId/current-question`

Get the current question with progress and navigation information.

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Current question retrieved",
  "data": {
    "question": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "competency": "Listening Comprehension",
      "level": "A1",
      "questionText": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"]
    },
    "testProgress": {
      "currentIndex": 0,
      "totalQuestions": 44,
      "questionsAnswered": 0,
      "progressPercentage": 0,
      "timeRemaining": 2640,
      "isLastQuestion": false,
      "hasNextQuestion": true
    },
    "navigation": {
      "canGoNext": false, // false until question is answered/skipped
      "canGoPrevious": false, // false for first question
      "canSkip": true, // true for unanswered questions
      "canSubmitTest": false // false until at least one question answered
    }
  }
}
```

### 4. Submit Answer

**POST** `/api/v1/assessments/:testId/submit-answer`

Submit an answer for the current question. This automatically advances to the next question.

#### Request Body

```json
{
  "questionId": "64f8a1b2c3d4e5f6a7b8c9d0", // Required
  "selectedOptionIndex": 2, // Required: 0-3
  "timeSpent": 45 // Required: seconds spent on question
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Answer submitted successfully",
  "data": {
    "isCorrect": true,
    "currentQuestionIndex": 1, // Auto-advanced to next question
    "isLastQuestion": false,
    "autoAdvanced": true
  }
}
```

#### Response (400 Bad Request) - Already Answered

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Question already answered"
}
```

### 5. Skip Question

**POST** `/api/v1/assessments/:testId/skip-question`

Skip the current question. This automatically advances to the next question.

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Question skipped successfully",
  "data": {
    "currentQuestionIndex": 1, // Auto-advanced to next question
    "isLastQuestion": false,
    "autoAdvanced": true
  }
}
```

### 6. Navigate Between Questions

**POST** `/api/v1/assessments/:testId/navigate`

Manually navigate between questions. For "next" navigation, current question must be answered or skipped.

#### Request Body

```json
{
  "direction": "next" // Required: "next" or "previous"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Navigation successful",
  "data": {
    "currentQuestionIndex": 2,
    "direction": "next"
  }
}
```

#### Response (400 Bad Request) - Must Answer First

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Must submit answer or skip current question before proceeding to next"
}
```

### 7. Complete Assessment

**POST** `/api/v1/assessments/:testId/complete`

Complete the assessment and calculate final score.

#### Request Body

```json
{
  "totalTimeSpent": 1800 // Required: total seconds spent on entire test
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Assessment completed successfully",
  "data": {
    "test": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "step": 1,
      "score": 86,
      "levelAchieved": "A2",
      "canProceedToNextStep": true,
      "blocksRetake": false
    },
    "certificate": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "levelAchieved": "A2"
    }
  }
}
```

### 8. Get Assessment History

**GET** `/api/v1/assessments/history`

Get the authenticated user's assessment history.

#### Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User assessments retrieved",
  "data": {
    "tests": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "step": 1,
        "score": 86,
        "levelAchieved": "A2",
        "status": "completed",
        "startedAt": "2024-01-01T10:00:00.000Z",
        "completedAt": "2024-01-01T10:44:00.000Z"
      },
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "step": 2,
        "score": 78,
        "levelAchieved": "B2",
        "status": "completed",
        "startedAt": "2024-01-02T10:00:00.000Z",
        "completedAt": "2024-01-02T10:44:00.000Z"
      }
    ]
  }
}
```

---

## Error Responses

### Authentication Errors

#### 401 Unauthorized - Missing Token

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required to access this resource."
}
```

#### 403 Forbidden - Wrong Role

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Access denied. Required role: admin. Your role: student."
}
```

### Validation Errors

#### 400 Bad Request - Invalid Input

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid step parameter. Must be 1, 2, or 3."
}
```

### Resource Errors

#### 404 Not Found

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Question not found"
}
```

#### 409 Conflict

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Assessment for Step 1 already in progress"
}
```

### Server Errors

#### 500 Internal Server Error

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Response Formats

### Success Response Structure

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    // Response data here
  },
  "pagination": {
    // Only for paginated responses
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 42,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response Structure

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errors": {
    // Only for validation errors
    "field1": "Field-specific error message",
    "field2": "Another field error"
  }
}
```

---

## Assessment Flow Example

### Complete One-Question-at-a-Time Flow

1. **Check Eligibility**

   ```http
   GET /api/v1/assessments/eligibility/1
   ```

2. **Start Assessment**

   ```http
   POST /api/v1/assessments/start
   Body: {"step": 1}
   ```

3. **Get First Question**

   ```http
   GET /api/v1/assessments/{testId}/current-question
   ```

4. **Submit Answer (auto-advances)**

   ```http
   POST /api/v1/assessments/{testId}/submit-answer
   Body: {"questionId": "...", "selectedOptionIndex": 2, "timeSpent": 45}
   ```

5. **Continue with remaining 43 questions...**

6. **Complete Assessment**

   ```http
   POST /api/v1/assessments/{testId}/complete
   Body: {"totalTimeSpent": 1800}
   ```

7. **View History**
   ```http
   GET /api/v1/assessments/history
   ```

---

## Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are MongoDB ObjectIds (24-character hexadecimal strings)
- The assessment system enforces a strict one-question-at-a-time flow
- Users cannot navigate to the next question without answering or skipping the current one
- Step 1 failure (<25%) permanently blocks all future assessments
- Each step requires ≥75% score to proceed to the next step
