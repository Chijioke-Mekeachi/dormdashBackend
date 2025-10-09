# 🏠 DormDash Backend API Documentation

This document describes how to use the **DormDash Backend API**, built
with Express.js and SQLite via the custom `SqliteAuto` library.

------------------------------------------------------------------------

## 🚀 Base URL

    http://localhost:2100

------------------------------------------------------------------------

## 📂 Endpoints Overview

  -------------------------------------------------------------------------------
  Module          Endpoint                   Method        Description
  --------------- -------------------------- ------------- ----------------------
  Auth            `/auth/signup`             POST          Create a new account

  Auth            `/auth/login`              POST          Login to existing
                                                           account

  Profile         `/profile/createProfile`   POST          Create user profile

  Profile         `/profile/getProfile`      POST          Fetch profile data

  Product         `/product/create`          POST          Create new product
                                                           listing

  Product         `/product/all`             GET           Get all product
                                                           listings

  Product         `/product/get/:id`         GET           Get product by ID

  Product         `/product/getByLogin`      POST          Get all products owned
                                                           by user

  Product         `/product/delete/:id`      DELETE        Delete product
                                                           (creator only)
  -------------------------------------------------------------------------------

------------------------------------------------------------------------

## 🧩 Authentication Endpoints

### **POST /auth/signup**

Creates a new user account.

**Body Example:**

``` json
{
  "email": "user@example.com",
  "password": "mypassword"
}
```

**Response:**

``` json
{
  "Message": "Account Created Successfully"
}
```

------------------------------------------------------------------------

### **POST /auth/login**

Logs in a user.

**Body Example:**

``` json
{
  "email": "user@example.com",
  "password": "mypassword"
}
```

**Response:**

``` json
{
  "Message": "Login Successfully"
}
```

------------------------------------------------------------------------

## 👤 Profile Endpoints

### **POST /profile/createProfile**

Creates a profile for a logged-in user.

**Body Example:**

``` json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "mode": "Student",
  "number": "08123456789",
  "password": "mypassword",
  "level": "400"
}
```

**Response:**

``` json
{
  "message": "Profile created successfully"
}
```

------------------------------------------------------------------------

### **POST /profile/getProfile**

Fetch profile by email & password.

**Body Example:**

``` json
{
  "email": "john@example.com",
  "password": "mypassword"
}
```

**Response:**

``` json
{
  "Fullname": "John Doe",
  "Email": "john@example.com",
  "Mode": "Student",
  "Number": "08123456789",
  "level": "400"
}
```

------------------------------------------------------------------------

## 🏘️ Product Endpoints

### **POST /product/create**

Create a new product listing.

**Body Example:**

``` json
{
  "title": "2 Bedroom Apartment",
  "type": "Apartment",
  "location": "Port Harcourt",
  "rent": 250000,
  "bedrooms": 2,
  "availability": "Available",
  "amnities": ["Water", "Electricity"],
  "boost": 0,
  "description": "Spacious apartment with water and light.",
  "contactinfo": "08123456789",
  "pictures": ["img1.jpg", "img2.jpg"],
  "owneremail": "john@example.com"
}
```

**Response:**

``` json
{
  "message": "✅ Product created successfully"
}
```

------------------------------------------------------------------------

### **GET /product/all**

Fetch all product listings.

**Response Example:**

``` json
[
  {
    "id": 1,
    "title": "2 Bedroom Apartment",
    "type": "Apartment",
    "rent": 250000,
    "amnities": ["Water", "Electricity"],
    "pictures": ["img1.jpg", "img2.jpg"]
  }
]
```

------------------------------------------------------------------------

### **GET /product/get/:id**

Fetch a specific product by ID.

**Example URL:**

    /product/get/1

**Response:**

``` json
{
  "id": 1,
  "title": "2 Bedroom Apartment",
  "owneremail": "john@example.com"
}
```

------------------------------------------------------------------------

### **POST /product/getByLogin**

Fetch all products created by a logged-in user.

**Body Example:**

``` json
{
  "email": "john@example.com",
  "password": "mypassword"
}
```

**Response Example:**

``` json
[
  {
    "id": 1,
    "title": "2 Bedroom Apartment",
    "owneremail": "john@example.com"
  }
]
```

------------------------------------------------------------------------

### **DELETE /product/delete/:id**

Delete a product (only if you're the creator).

**Body Example:**

``` json
{
  "email": "john@example.com",
  "password": "mypassword"
}
```

**Response:**

``` json
{
  "message": "🗑️ Product deleted successfully"
}
```

**Error (not creator):**

``` json
{
  "error": "⛔ You are not the creator of this product"
}
```

------------------------------------------------------------------------

## ⚙️ Setup Instructions

1.  Install dependencies:

    ``` bash
    npm install express cors bcryptjs sqlite3
    ```

2.  Run the server:

    ``` bash
    node server.js
    ```

3.  Base file structure:

        ├── database/
        │   └── SqliteAuto.js
        ├── routes/
        │   ├── auth.js
        │   ├── profile.js
        │   └── properties.js
        ├── server.js
        └── dormDash.db

------------------------------------------------------------------------

## 🧠 Developer Notes

-   All data is persisted in SQLite.
-   Only product creators can delete their listings.
-   Arrays like `amnities` and `pictures` are stored as JSON strings.
-   Authentication uses `authSignUp` and `authLogin` from `SqliteAuto`.

------------------------------------------------------------------------

**Author:** Chijioke Mekelachi\
**Email:** mekelachichijioke@gmail.com\
**Project:** DormDash (Backend)
