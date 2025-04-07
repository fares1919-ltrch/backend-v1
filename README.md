# Untitled

# API Endpoints Documentation

## Authentication Endpoints

### 1. Sign Up

**Method:** POST

**URL:** `http://localhost:8080/api/auth/signup`

**Headers:**

- `Content-Type: application/json`

**Request Body (JSON):**

```json
{
  "username": "example",
  "email": "example@example.com",
  "password": "123456",
  "roles":["user"]
}
{
  "username": "faress",
  "email": "exadddd@example.com",
  "password": "123456",
  "roles": ["manager", "user"]
}// This is perfectly valid
{
  "username": "faress",
  "email": "exadddd@example.com",
  "password": "123456",
  "roles": ["manager", "user", "officer"]
}// This is also valid

"roles" not "role"
```

**Description:** Registers a new user in the system.

---

### 2. Sign In

**Method:** POST

**URL:** `http://localhost:8080/api/auth/signin`

**Headers:**

- `Content-Type: application/json`

**Request Body (JSON):**

```json
{
  "username": "example",
  "password": "123456"
}
```

**Description:** Logs in a user and returns a JWT token.

---

### 3. Sign Out

**Method:** POST

**URL:** `http://localhost:8080/api/auth/signout`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Logs out a user by invalidating the token.

---

### 4. Refresh Token

**Method:** POST

**URL:** `http://localhost:8080/api/auth/refreshtoken`

**Headers:**

- `Content-Type: application/json`

**Request Body (JSON):**

```json
{
  "refreshToken": "string"
}
```

**Description:** Refreshes an expired access token using a refresh token.

---

### 5. Google OAuth Authentication

**Method:** GET

**URL:** `http://localhost:8080/api/auth/google`

**Description:** Initiates Google OAuth authentication flow.

---

### 6. Google OAuth Callback

**Method:** GET

**URL:** `http://localhost:8080/api/auth/google/callback`

**Description:** Callback URL for Google OAuth authentication.

---

### 7. GitHub OAuth Authentication

**Method:** GET

**URL:** `http://localhost:8080/api/auth/github`

**Description:** Initiates GitHub OAuth authentication flow.

---

### 8. GitHub OAuth Callback

**Method:** GET

**URL:** `http://localhost:8080/api/auth/github/callback`

**Description:** Callback URL for GitHub OAuth authentication.

---

## Public and Protected Content Endpoints

### 9. Public Content

**Method:** GET

**URL:** `http://localhost:8080/api/test/all`

**Headers:** None

**Request Body:** None

**Description:** Provides access to public content.

---

### 10. User Board

**Method:** GET

**URL:** `http://localhost:8080/api/test/user`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Provides user-specific content.

---

### 11. Manager Board

**Method:** GET

**URL:** `http://localhost:8080/api/test/manager`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Provides manager-specific content.

---

### 12. Officer Board

**Method:** GET

**URL:** `http://localhost:8080/api/test/officer`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Provides officer-specific content.

---

### 13. Welcome Message

**Method:** GET

**URL:** `http://localhost:8080/`

**Headers:** None

**Request Body:** None

**Description:** Root endpoint displaying a welcome message.

---

## Password Management Endpoints

### 14. Forgot Password

**Method:** POST

**URL:** `http://localhost:8080/api/password/forgot`

**Headers:**

- `Content-Type: application/json`

**Request Body (JSON):**

```json
{
  "email": "string"
}
```

**Description:** Sends a password reset email to the user.

---

### 15. Reset Password

**Method:** POST

**URL:** `http://localhost:8080/api/password/reset`

**Headers:**

- `Content-Type: application/json`

**Request Body (JSON):**

```json
{
  "token": "string",
  "password": "string"
}
```

**Description:** Resets a user's password using a reset token.

---

### 16. Change Password

**Method:** POST

**URL:** `http://localhost:8080/api/password/change`

**Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Request Body (JSON):**

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Description:** Changes a user's password when logged in.

---

## Profile Management Endpoints

### 17. Get User Profile

**Method:** GET

**URL:** `http://localhost:8080/api/profile`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Retrieves the authenticated user's profile information.

---

### 18. Update User Profile

**Method:** PUT

**URL:** `http://localhost:8080/api/profile`

**Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Request Body (JSON):**

```json
{
  "firstName": "string",
  "lastName": "string",
  "address": "string",
  "city": "string",
  "country": "string",
  "postalCode": "string",
  "aboutMe": "string",
  "work": "string",
  "workplace": "string",
  "photo": "string"
}
```

**Description:** Updates the authenticated user's profile information.

---

### 19. Delete User Account

**Method:** DELETE

**URL:** `http://localhost:8080/api/profile`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Deletes the authenticated user's account.

---

### 20. Link OAuth Account

**Method:** POST

**URL:** `http://localhost:8080/api/profile/link-oauth`

**Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Request Body (JSON):**

```json
{
  "provider": "string",
  "providerId": "string"
}
```

**Description:** Links an OAuth account to the user's profile.

---

### 21. Get Active Sessions

**Method:** GET

**URL:** `http://localhost:8080/api/profile/sessions`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Retrieves the authenticated user's active sessions.

---

### 22. Revoke Session

**Method:** DELETE

**URL:** `http://localhost:8080/api/profile/sessions/:sessionToken`

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:** None

**Description:** Revokes a specific session for the authenticated user.

---

## Notes:

- Replace `<token>` in the `Authorization` header with the actual JWT token received after logging in.
- Ensure the `Content-Type` header is set to `application/json` for endpoints that require a request body.
- Unauthorized access to protected endpoints will result in a `401 Unauthorized` response.
- The API includes rate limiting for login attempts (5 attempts per 15 minutes).
- CSRF protection is implemented for all routes except OAuth callbacks[this will be added later just befor production].
