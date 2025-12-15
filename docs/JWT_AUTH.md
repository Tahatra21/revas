# JWT Authentication Setup

## Overview

The Revas application now includes JWT-based authentication with role-based access control.

## Features

- ✅ User registration and login
- ✅ JWT token generation and verification
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (admin, manager, user)
- ✅ SBU-based user assignment
- ✅ Protected API routes

## Database Schema

### Users Table

```sql
users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',  -- admin, manager, user
  sbu_id INTEGER REFERENCES master_sbu(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Environment Variables

Add these to your `.env.local` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
```

**IMPORTANT:** Change the `JWT_SECRET` to a strong, random string in production!

## API Endpoints

### 1. Register New User

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "john.doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "role": "user",
  "sbuId": 1
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john.doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "user",
    "sbuId": 1
  }
}
```

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@revas.com",
    "fullName": "System Administrator",
    "role": "admin",
    "sbuId": null
  }
}
```

### 3. Verify Token / Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@revas.com",
    "role": "admin",
    "sbuId": null
  }
}
```

## Default Admin Account

A default admin account is created automatically:

- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@revas.com`
- **Role:** `admin`

**⚠️ IMPORTANT:** Change this password immediately in production!

## Protecting API Routes

Use the middleware helpers to protect your API routes:

### Example: Require Authentication

```typescript
import { requireAuth, handleAuthError } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    
    // User is authenticated, proceed with logic
    return NextResponse.json({ data: "protected data" });
  } catch (error) {
    return handleAuthError(error);
  }
}
```

### Example: Require Specific Role

```typescript
import { requireRole, handleAuthError } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  try {
    // Only admins and managers can access
    const user = await requireRole(req, ["admin", "manager"]);
    
    // Proceed with admin/manager logic
    return NextResponse.json({ message: "Success" });
  } catch (error) {
    return handleAuthError(error);
  }
}
```

## User Roles

- **admin** - Full system access, can manage all data
- **manager** - Can manage data within assigned SBU
- **user** - Read-only access, limited modifications

## Testing Authentication

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "role": "user"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Save the token from the response.

### 3. Verify Token

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Frontend Integration

### Storing the Token

```typescript
// After login/register
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const { token, user } = await response.json();

// Store in localStorage or cookies
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

### Making Authenticated Requests

```typescript
const token = localStorage.getItem('token');

const response = await fetch('/api/pipeline', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Logout

```typescript
// Simply remove the token
localStorage.removeItem('token');
localStorage.removeItem('user');
```

## Security Best Practices

1. **Change Default Credentials** - Update admin password immediately
2. **Use Strong JWT Secret** - Generate a random 32+ character string
3. **HTTPS Only** - Always use HTTPS in production
4. **Token Expiration** - Tokens expire after 7 days by default
5. **Password Requirements** - Enforce strong passwords in production
6. **Rate Limiting** - Add rate limiting to login endpoint
7. **Refresh Tokens** - Consider implementing refresh tokens for better security

## Next Steps

1. Update `.env.local` with a strong JWT_SECRET
2. Change the default admin password
3. Test the authentication endpoints
4. Integrate authentication into the frontend
5. Add protected routes to your API endpoints
6. Implement role-based UI rendering

## Files Created

- [database/auth.sql](file:///Users/jmaharyuda/Project/revas/database/auth.sql) - Users table schema
- [lib/auth.ts](file:///Users/jmaharyuda/Project/revas/lib/auth.ts) - JWT utilities
- [lib/middleware.ts](file:///Users/jmaharyuda/Project/revas/lib/middleware.ts) - Auth middleware
- [app/api/auth/login/route.ts](file:///Users/jmaharyuda/Project/revas/app/api/auth/login/route.ts) - Login endpoint
- [app/api/auth/register/route.ts](file:///Users/jmaharyuda/Project/revas/app/api/auth/register/route.ts) - Register endpoint
- [app/api/auth/me/route.ts](file:///Users/jmaharyuda/Project/revas/app/api/auth/me/route.ts) - Token verification
- [.env.example](file:///Users/jmaharyuda/Project/revas/.env.example) - Environment template
