# DormDash Backend API Endpoints

This file lists the HTTP endpoints exposed by the DormDash backend. Paths are shown relative to the API root (server runs on port 2100 by default). Each endpoint includes method, path, expected request body or params, and a brief description.

Base URL: http://localhost:2100

## Root

- GET /
  - Description: Health check — returns a simple JSON message.
  - Response: { message: "Server is Running" }

## Auth routes (prefix: /auth)

- POST /auth/login
  - Body (JSON): { email: string, password: string }
  - Description: Verify credentials. On success returns { Message: "Login Successfully" }. On failure returns 400 with error message.

- POST /auth/signup
  - Body (JSON): { email: string, password: string }
  - Description: Create a new auth account. On success returns { Message: "Account Created Successfully" }.

- GET /auth/test
  - Description: Simple test route that returns { result: "success" }.

## Profile routes (prefix: /profile)

- POST /profile/createProfile
  - Body (JSON):
    - fullName: string (required)
    - email: string (required)
    - mode: string (required)
    - number: string (required)
    - password: string (required) — used to authenticate the user before creating the profile
    - level: string (optional)
  - Description: Creates a `profile` record after authenticating the user's account. Responses:
    - 201: { message: "Profile created successfully" }
    - 400: { error: "All fields are required" } or { error: "Profile already exists" } or auth errors

- POST /profile/getProfile
  - Body (JSON): { email: string, password: string }
  - Description: Authenticates the user then returns profile fields: Fullname, Email, Mode, Number, level.
  - Responses: 200 with profile object, 400 if credentials missing/invalid, 404 if profile not found.

- PUT /profile/updateProfile
  - Body (JSON):
    - email: string (required)
    - password: string (required)
    - fullName: string (optional)
    - mode: string (optional)
    - number: string (optional)
    - level: string (optional)
  - Description: Authenticates user and updates provided profile fields. Returns 200 on success.

## Product routes (prefix: /product)

- POST /product/create
  - Body (JSON): product object with fields (required: title, type, rent, owneremail). Example fields:
    - title: string
    - type: string
    - location: string
    - rent: number
    - bedrooms: number
    - availability: string
    - amnities: array|string (array will be JSON-stringified)
    - boost: number
    - description: string
    - contactinfo: string
    - pictures: array|string (array will be JSON-stringified)
    - owneremail: string
  - Description: Creates a new product listing. Returns 201 on success.

- GET /product/all
  - Description: Returns all products. Fields `amnities` and `pictures` are parsed into arrays when present.

- GET /product/get/:id
  - Params: id (product id)
  - Description: Return a single product by its id. 404 if not found.

- POST /product/getByLogin
  - Body (JSON): { email: string, password: string }
  - Description: Authenticate user, then return all products whose `owneremail` matches `email`.
  - Responses: 200 with array of products, 404 if none found for the user.

- DELETE /product/delete/:id
  - Params: id (product id)
  - Body (JSON): { email: string, password: string }
  - Description: Authenticates the user and deletes the product if the authenticated user is the product owner. Returns 200 on success.

---

Notes:
- Authentication is implemented by calling `db.authLogin({ email, password })` — this is a synchronous check implemented in `database/SqliteAuto.js`.
- The `product` table stores `amnities` and `pictures` as JSON-serialized arrays in the database; route handlers parse them back to arrays before responding.

If you'd like, I can:
- Add short curl examples for each endpoint.
- Generate an OpenAPI (Swagger) spec or Postman collection from these routes.

## Recommended / Additional endpoints (suggested)

Below are endpoints the frontend currently expects or would benefit from. They are suggested additions to fully support the UI without mock data. Request/response shapes and which components use them are included.

### Auth & Session

- POST /auth/login
  - Request: { email: string, password: string }
  - Suggested Response: { user: User, token: string, refreshToken?: string }
  - Frontend: store token (localStorage/session) and attach Authorization header.

- POST /auth/refresh
  - Request: { refreshToken }
  - Response: { token, refreshToken }
  - Purpose: rotate tokens for long sessions.

- POST /auth/logout
  - Request: {} or Authorization header
  - Response: { ok: true }
  - Purpose: invalidate refresh token/session on server.

### Profile & Users

- GET /profile/:id
  - Request: none (Authorization header)
  - Response: User profile object
  - Used by: `ProfilePage` to load current user

- PUT /profile/:id
  - Request: partial profile fields to update (name, phone, avatarUrl, etc.)
  - Response: updated profile object
  - Used by: `ProfilePage` → Save edits

- POST /profile/upload-avatar
  - Request: multipart/form-data { file }
  - Response: { url: string }
  - Used by: profile avatar upload dialog

- GET /users (admin)
  - Request: optional filters, Authorization: admin
  - Response: list of users
  - Used by: `AdminDashboard`

- POST /users/verify
  - Request: { userId, type }
  - Response: { status }
  - Used by: `AdminDashboard` to approve verifications

### Products / Listings

- GET /product/search
  - Query params: ?q=&location=&propertyType=&minPrice=&maxPrice=&amenities=&page=&limit=
  - Response: { results: Product[], total, page, limit }
  - Purpose: server-side search & filter (replace client-side filtering). Used by: `PropertySearch`

- GET /product/owner/:ownerId or GET /product/my
  - Request: Authorization header or ownerId param
  - Response: properties for a landlord/agent
  - Used by: `LandlordDashboard`, `AgentDashboard`

- POST /product/:id/images
  - Request: multipart upload for images
  - Response: uploaded image URLs
  - Used by: Add/Edit Property forms

- PUT /product/:id
  - Request: updated property fields
  - Response: updated product object
  - Used by: Edit property flows

- POST /product/:id/boost
  - Request: { planId, duration, paymentRef } or minimal { plan }
  - Response: { boostId, expiresAt, status }
  - Used by: BoostingServices and dashboard boosting UI

- GET /product/:id/boost-status
  - Response: current boost status
  - Used by: property card badges

### Messages / Inquiries / Conversations

- POST /inquiries
  - Request: { propertyId, fromName, fromEmail, fromPhone, message }
  - Response: { id, createdAt, sent: true }
  - Used by: Contact / inquiry forms (PropertyDetail)

- GET /inquiries?propertyId=:id
  - Response: list of inquiries/messages
  - Used by: Landlord/Agent dashboards

- GET /messages/user/:userId or /messages/conversations
  - Response: conversations or messages list
  - Used by: messaging UIs

- POST /messages/send
  - Request: { toUserId, propertyId?, body }
  - Response: sent message

### Boosting & Payments

- GET /boost/plans
  - Response: list of boosting plans { id, name, price, durationDays, features[] }
  - Used by: BoostingServices

- POST /payments/initiate
  - Request: { amount, currency, metadata, returnUrl }
  - Response: { paymentUrl, paymentId } or a payment token
  - Used by: purchasing a boost plan

- Paystack integration
  - POST /payments/paystack/initiate
    - Request: { amount, email, metadata }
    - Response: { authorization_url, reference }
    - Notes: Uses PAYSTACK_SECRET env var. Amount expected in major currency units (ngn); the server multiplies by 100 for Paystack API.

  - GET /payments/paystack/verify/:reference
    - Response: Paystack transaction object (data) and updates local payments status
    - Notes: Verify payment status from Paystack and update the `payments` table.

- GET /payments/:paymentId/status
  - Response: { status: 'pending'|'completed'|'failed', receipt? }

- GET /transactions (admin)
  - Response: list of platform transactions
  - Used by: AdminDashboard

### Admin & Reporting

- GET /admin/properties (with filters)
  - Response: paginated properties for admin
  - Used by: AdminDashboard

- DELETE /admin/property/:id (or reuse /product/delete/:id with admin auth)
  - Response: deletion status

- GET /admin/stats
  - Response: aggregated stats used on admin dashboard

### Agent / Commission

- GET /agents/:id/commissions
  - Response: list of commission entries
  - Used by: AgentDashboard

- POST /commissions/settle
  - Request: { agentId, month, amount, reference }
  - Response: status

### Favorites / Bookmarks / Applications

- POST /favorites
  - Request: { userId (or auth), productId }
  - Response: favorite object

- DELETE /favorites/:id
  - Response: status

- GET /favorites (user)
  - Response: favorites list

### Misc / Utility

- GET /navigation or /meta/navigation
  - Response: nav/menu items

- Uploads static files
  - Files uploaded via endpoints are served from: GET /uploads/<filename>


- GET /safety-rating/:propertyId
  - Response: safety rating metrics

- GET /suggestions?propertyId=
  - Response: similar listings

---

If you want, I can now:
- Add curl examples for the most-used endpoints (login, createProfile, get product by id, get all products).
- Generate an OpenAPI (Swagger) spec from this document so frontend devs can import it into tools like Postman.

