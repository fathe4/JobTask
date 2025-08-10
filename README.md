# Test School Assessment Platform - Backend

A Node.js/Express backend API for the Test School competency assessment platform. This backend provides secure APIs for authentication, user management, question management, and assessment processing.

## 🎯 What's Built

### ✅ Completed Features

#### Authentication System

- **User Registration** with email verification
- **JWT Login/Logout** with access and refresh tokens
- **OTP Verification** for secure operations
- **Password Reset** functionality
- **Role-based Access Control** (Admin, Student, Supervisor)

#### User Management

- **Profile Management** - Users can update their own profiles
- **Admin User Control** - Admins can manage user roles
- **Secure Password Changes** with current password verification

#### Question Management (Admin Only)

- **Create Questions** with competency mapping (A1-C2 levels)
- **Question Bank Management** with 22 competencies × 6 levels structure
- **Question Filtering** by step (A1-A2, B1-B2, C1-C2)
- **Validation** ensures exactly 4 options per question

#### Assessment Engine

- **3-Step Progressive Testing** (A1-A2 → B1-B2 → C1-C2)
- **One Question at a Time** assessment flow
- **Real-time Progress Tracking** with navigation controls
- **Answer Submission** with automatic progression
- **Score Calculation** with level determination
- **No-Retake Policy** enforcement (fail Step 1 <25% = blocked)

#### Database Models

- **User Model** with role management and assessment status
- **Question Model** with competency levels and validation
- **Test Model** with session management and progress tracking
- **TestResponse Model** for individual answer storage
- **Certificate Model** for achievement tracking

### 🔧 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Custom middleware with TypeScript types
- **Security**: bcrypt for passwords, rate limiting, CORS

## 📋 Prerequisites

Before running the backend, make sure you have:

- **Node.js** (version 16.0 or higher)
- **MongoDB** (running locally or MongoDB Atlas)
- **npm** or **yarn**

## 🚀 How to Run

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the backend root:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/testschool
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/testschool

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# JWT Expiry
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Email (for OTP - optional for testing)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Start the Server

Development mode (with auto-restart):

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

The server will run at `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── question.controller.ts
│   │   └── assessment.controller.ts
│   ├── services/           # Business logic
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── question.service.ts
│   │   └── assessment.service.ts
│   ├── models/             # Database schemas
│   │   ├── User.model.ts
│   │   ├── Question.model.ts
│   │   ├── Test.model.ts
│   │   └── Certificate.model.ts
│   ├── middleware/         # Express middleware
│   │   ├── auth.middleware.ts
│   │   └── rbac.middleware.ts
│   ├── routes/             # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── question.routes.ts
│   │   └── assessment.routes.ts
│   ├── types/              # TypeScript types
│   ├── utils/              # Helper functions
│   └── server.ts           # Main server file
├── .env                    # Environment variables
└── package.json            # Dependencies
```

## 🔗 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/verify-otp` - Verify email OTP
- `POST /api/v1/auth/forgot-password` - Send password reset
- `POST /api/v1/auth/reset-password` - Reset password

### User Management

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update profile
- `PUT /api/v1/users/change-password` - Change password
- `PUT /api/v1/users/:id/role` - Change user role (Admin only)

### Questions (Admin Only)

- `POST /api/v1/questions` - Create question
- `GET /api/v1/questions` - Get questions with filters
- `PUT /api/v1/questions/:id` - Update question
- `DELETE /api/v1/questions/:id` - Delete question
- `GET /api/v1/questions/step/:step` - Get questions for assessment step

### Assessments (Students)

- `GET /api/v1/assessments/eligibility/:step` - Check if can take step
- `POST /api/v1/assessments/start` - Start new assessment
- `GET /api/v1/assessments/:testId/current-question` - Get current question
- `POST /api/v1/assessments/:testId/submit-answer` - Submit answer
- `POST /api/v1/assessments/:testId/skip-question` - Skip question
- `POST /api/v1/assessments/:testId/complete` - Complete assessment

## 🧪 Testing the API

You can test the API using tools like:

### Using curl

```bash
# Register a new user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using Postman

1. Import the API endpoints
2. Set base URL to `http://localhost:5000/api/v1`
3. For protected routes, add JWT token in Authorization header

## 🔐 Security Features

- **JWT Authentication** with access and refresh tokens
- **Password Hashing** using bcrypt
- **Role-based Access Control** for different user types
- **Input Validation** on all endpoints
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for frontend integration

## 🗃️ Database Design

### Users Collection

- Authentication data (email, password)
- Profile information (name, role)
- Assessment status tracking

### Questions Collection

- Question content and options
- Competency mapping (22 competencies)
- Level categorization (A1-C2)

### Tests Collection

- Assessment sessions
- Progress tracking
- Question randomization

### Responses Collection

- Individual question answers
- Timing information
- User responses

## 🐛 Common Issues

### JWT Errors

- Make sure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set in `.env`
- Secrets should be long and random

### Port Already in Use

```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

## 🔧 Development Scripts

```bash
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled JavaScript
npm run lint         # Run ESLint
npm run test         # Run tests (when implemented)
```

---

**Test School Backend** - Secure, scalable API for competency assessment platform.
