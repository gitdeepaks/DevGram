# DevGram

A social networking API for developers to connect with each other. Built with Express.js, MongoDB, and Bun runtime.

## Installation

To install dependencies:

```bash
bun install
```

## Running the Project

To run the development server:

```bash
bun run dev
```

Or to run the production server:

```bash
bun run src/index.js
```

The server runs on port **4100** by default.

## Project Structure

```
src/
├── config/
│   └── database.js          # MongoDB connection configuration
├── middlewares/
│   └── auth.middleware.js    # JWT authentication middleware
├── models/
│   ├── user.model.js         # User schema and model
│   └── connectionRequest.model.js  # Connection request schema
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── profile.js           # User profile routes
│   ├── request.js           # Connection request routes
│   └── user.js              # User feed and connections routes
├── utils/
│   └── validations.js       # Input validation utilities
└── index.js                 # Application entry point
```

## API Routes & Workflows

### 1. Authentication Routes (`/routes/auth.js`)

#### POST `/singup`
**Description:** Register a new user account.

**Workflow:**
1. Validates signup data (firstName, lastName, emailId, password)
2. Hashes the password using bcrypt (10 rounds)
3. Creates a new user in the database
4. Returns success message

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "emailId": "john@example.com",
  "password": "password123"
}
```

**Response:**
- Success: `200` - "user added successfully"
- Error: `400` - Error message

---

#### POST `/login`
**Description:** Authenticate user and create a session.

**Workflow:**
1. Finds user by emailId
2. Validates password using bcrypt comparison
3. Generates JWT token (expires in 1 day)
4. Sets JWT token as HTTP-only cookie (`authToken`)
5. Returns success message

**Request Body:**
```json
{
  "emailId": "john@example.com",
  "password": "password123"
}
```

**Response:**
- Success: `200` - "Login successful!!!"
- Error: `400` - "Email or password is not valid"

**Note:** The JWT token is stored in an HTTP-only cookie for security.

---

#### POST `/logout`
**Description:** Logout the authenticated user.

**Workflow:**
1. Requires authentication (userAuth middleware)
2. Clears the `authToken` cookie by setting it to expire immediately
3. Returns success message

**Authentication:** Required (JWT token in cookie or body)

**Response:**
- Success: `200` - "user loggedout"

---

### 2. Profile Routes (`/routes/profile.js`)

#### GET `/profile/view`
**Description:** View the authenticated user's profile.

**Workflow:**
1. Requires authentication (userAuth middleware)
2. Retrieves user from `req.user` (set by auth middleware)
3. Returns complete user profile data

**Authentication:** Required

**Response:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "emailId": "john@example.com",
  "age": 25,
  "gender": "male",
  "photoUrl": "https://...",
  "about": "Developer...",
  "skills": ["JavaScript", "Node.js"],
  ...
}
```

---

#### PATCH `/profile/edit`
**Description:** Update the authenticated user's profile information.

**Workflow:**
1. Requires authentication
2. Validates profile edit data
3. Updates user fields from request body
4. Saves updated user to database
5. Returns updated user data

**Authentication:** Required

**Request Body:** (All fields optional)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "age": 26,
  "gender": "male",
  "photoUrl": "https://example.com/photo.jpg",
  "about": "Updated about section",
  "skills": ["JavaScript", "Node.js", "React"]
}
```

**Response:**
```json
{
  "message": "John your profile has been updated successfully",
  "data": { /* updated user object */ }
}
```

---

#### POST `/profile/password`
**Description:** Reset user password (forgot password functionality).

**Workflow:**
1. Validates emailId and newPassword are provided
2. Validates new password is at least 8 characters
3. Finds user by emailId
4. Hashes the new password
5. Updates user password in database
6. Returns success message

**Request Body:**
```json
{
  "emailId": "john@example.com",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully",
  "emailId": "john@example.com"
}
```

---

### 3. Connection Request Routes (`/routes/request.js`)

#### POST `/request/status/:status/:toUserId`
**Description:** Send a connection request or ignore a user.

**Workflow:**
1. Requires authentication
2. Validates status is either "interested" or "ignored"
3. Prevents self-connection (fromUserId ≠ toUserId)
4. Verifies target user exists
5. Checks for existing connection request (in either direction)
6. If request exists, updates status; otherwise creates new request
7. Returns connection request data

**Authentication:** Required

**URL Parameters:**
- `status`: "interested" or "ignored"
- `toUserId`: Target user's MongoDB ObjectId

**Example:**
```
POST /request/status/interested/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "message": "John is interested to Jane",
  "data": {
    "fromUserId": "...",
    "toUserId": "...",
    "status": "interested",
    ...
  }
}
```

**Status Values:**
- `interested`: User wants to connect
- `ignored`: User wants to ignore/hide this user

---

#### POST `/request/review/:status/:requestId`
**Description:** Review and respond to a received connection request.

**Workflow:**
1. Requires authentication
2. Validates status is either "accepted" or "rejected"
3. Finds connection request where:
   - Request ID matches
   - Current user is the recipient (toUserId)
   - Current status is "interested"
4. Updates request status to "accepted" or "rejected"
5. Saves and returns updated request

**Authentication:** Required

**URL Parameters:**
- `status`: "accepted" or "rejected"
- `requestId`: Connection request's MongoDB ObjectId

**Example:**
```
POST /request/review/accepted/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "message": "John has accepted the connection request",
  "data": {
    "fromUserId": "...",
    "toUserId": "...",
    "status": "accepted",
    ...
  }
}
```

**Status Flow:**
- `interested` → `accepted`: Connection established
- `interested` → `rejected`: Request declined

---

### 4. User Routes (`/routes/user.js`)

#### GET `/user/request/recieved`
**Description:** Get all pending connection requests received by the authenticated user.

**Workflow:**
1. Requires authentication
2. Finds all connection requests where:
   - Current user is the recipient (toUserId)
   - Status is "interested" (pending)
3. Populates sender information (fromUserId) with safe user data
4. Returns list of pending requests

**Authentication:** Required

**Response:**
```json
{
  "message": "Connection requests received",
  "data": [
    {
      "fromUserId": {
        "firstName": "Jane",
        "lastName": "Smith",
        "photoUrl": "...",
        "age": 28,
        "about": "...",
        "skills": [...],
        "gender": "female"
      },
      "status": "interested",
      ...
    }
  ]
}
```

**Safe User Data Fields:** firstName, lastName, photoUrl, age, about, skills, gender

---

#### GET `/user/connections`
**Description:** Get all accepted connections for the authenticated user.

**Workflow:**
1. Requires authentication
2. Finds all connection requests where:
   - Status is "accepted"
   - Current user is either sender or recipient
3. Populates both fromUserId and toUserId with safe user data
4. Maps results to return only the other user (not the logged-in user)
5. Returns list of connected users

**Authentication:** Required

**Response:**
```json
{
  "message": "Connections",
  "data": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "photoUrl": "...",
      "age": 28,
      "about": "...",
      "skills": [...],
      "gender": "female"
    }
  ]
}
```

---

#### GET `/user/feed`
**Description:** Get user feed showing potential connections (users not yet interacted with).

**Workflow:**
1. Requires authentication
2. Finds all connection requests involving the current user (as sender or recipient)
3. Creates a set of user IDs to exclude from feed:
   - Current user's own ID
   - All users with existing connection requests (any status)
4. Queries users excluding:
   - Current user
   - Users with existing connection requests
5. Returns safe user data for potential connections

**Authentication:** Required

**Response:**
```json
{
  "message": "Feed",
  "data": [
    {
      "firstName": "Alice",
      "lastName": "Johnson",
      "photoUrl": "...",
      "age": 30,
      "about": "...",
      "skills": [...],
      "gender": "other"
    }
  ]
}
```

**Exclusion Logic:**
- Own profile
- Existing connections (accepted)
- Pending requests (interested)
- Ignored users (ignored)
- Rejected requests

---

## Authentication

Most routes require authentication via JWT token. The token can be provided in two ways:

1. **Cookie** (preferred): Automatically sent with requests as `authToken`
2. **Request Body**: Include `token` field in POST request body

The authentication middleware (`userAuth`) validates the token and attaches the user object to `req.user`.

## Database Models

### User Model
- `firstName` (required, min 3 chars)
- `lastName`
- `emailId` (required, unique, validated)
- `password` (required, min 8 chars, hashed)
- `age` (min 18)
- `gender` (enum: "male", "female", "other")
- `photoUrl` (validated URL, default provided)
- `about` (default: "This is the about section")
- `skills` (array of strings)
- `timestamps` (createdAt, updatedAt)

### Connection Request Model
- `fromUserId` (required, ref: User)
- `toUserId` (required, ref: User)
- `status` (required, enum: "ignored", "interested", "accepted", "rejected")
- `timestamps` (createdAt, updatedAt)
- Indexed on `fromUserId` and `toUserId`
- Prevents self-connection requests

## Connection Request Status Flow

```
User A → User B: "interested"
  ↓
User B reviews: "accepted" or "rejected"
  ↓
If "accepted": Connection established
If "rejected": Request declined
```

Alternative:
```
User A → User B: "ignored"
  ↓
User B hidden from User A's feed
```

## Environment Variables

Required environment variables:
- `JWT_SECRET`: Secret key for JWT token signing
- MongoDB connection string (configured in `src/config/database.js`)

## Technologies Used

- **Runtime:** Bun
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Validation:** validator.js
- **Code Quality:** Biome

---

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
