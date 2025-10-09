# DormDash Backend API Documentation

This document explains how to use the **DormDash Backend API**, built using Express.js and a custom SQLite wrapper (`SqliteAuto`).

---

## 📦 Overview

The API allows for managing users, profiles, and authentication through a simple local database system (`SQLite`).  
It includes endpoints for:
- Authentication (`signup`, `login`)
- Profile creation and retrieval
- Secure data handling using bcrypt

---

## 🚀 Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

```bash
git clone <your_repo_url>
cd DormDash_Backend
npm install
```

### Run Server

```bash
node index.js
```
or, if you use nodemon:
```bash
npx nodemon index.js
```

---

## ⚙️ Database Structure (via `SqliteAuto`)

The `SqliteAuto` class automatically initializes and manages SQLite tables.

| Table Name | Fields |
|-------------|---------|
| `users` | id, email, password |
| `profile` | Fullname, Email, Mode, Number, level |

---

## 🔐 Authentication Routes

### `POST /signup`

Creates a new user account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "message": "User created successfully"
}
```

### `POST /login`

Logs in an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "message": "Login successful"
}
```

---

## 👤 Profile Routes

### `POST /createProfile`

Creates a profile for an authenticated user.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "mode": "Hostel",
  "number": "08123456789",
  "password": "123456",
  "level": "400"
}
```

**Response:**
```json
{
  "message": "Profile created successfully"
}
```

### `POST /getProfile`

Retrieves a user’s profile after verifying credentials.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "Fullname": "John Doe",
  "Email": "john@example.com",
  "Mode": "Hostel",
  "Number": "08123456789",
  "level": "400"
}
```

### `POST /updateProfile`

Updates an existing user’s profile.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "123456",
  "updates": {
    "Fullname": "John Updated",
    "Number": "09099999999",
    "level": "500"
  }
}
```

**Response:**
```json
{
  "message": "Profile updated successfully"
}
```

---

## 💻 Example: Calling the API in JavaScript (Frontend)

```javascript
// Base URL of your backend
const BASE_URL = "http://localhost:5000";

// Create a new profile
async function createProfile() {
  const res = await fetch(`${BASE_URL}/createProfile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "John Doe",
      email: "john@example.com",
      mode: "Hostel",
      number: "08123456789",
      password: "123456",
      level: "400"
    })
  });
  const data = await res.json();
  console.log(data);
}

// Get a user profile
async function getProfile() {
  const res = await fetch(`${BASE_URL}/getProfile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "john@example.com",
      password: "123456"
    })
  });
  const data = await res.json();
  console.log(data);
}

// Update a user profile
async function updateProfile() {
  const res = await fetch(`${BASE_URL}/updateProfile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "john@example.com",
      password: "123456",
      updates: {
        Fullname: "John Updated",
        level: "500"
      }
    })
  });
  const data = await res.json();
  console.log(data);
}
```

---

## 🧠 Notes
- Only authenticated users can create or modify their profiles.
- Passwords are securely hashed via bcrypt in the `SqliteAuto` class.
- Make sure to configure CORS correctly for your frontend.

---

**Author:** Chijioke Mekelachi  
**Project:** DormDash Backend  
**Database:** SQLite  
**Framework:** Express.js  
**Language:** JavaScript (Node.js)