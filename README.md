# 🚀 NestJS Technical Task

A modular **NestJS monorepo backend** using the `apps/` structure for **User Management**, designed to showcase:

- Clean architecture using MVC
- Microservices with TCP communication
- MongoDB integration
- Request validation, rate limiting, Swagger docs, and Dockerization

## ✨ Features

### ✅ Core Features

- **Register User** (`POST /auth/register`)
- **Login User** (`POST /auth/login`)
- **Get All Users** (`GET /auth/users`)
- **Get Profile** (`GET /auth/profile`)
- **Health Check** (`GET /health`)

### ✅ Microservices

- Internal communication between apps via **TCP transport**
- Message patterns defined for user management

### 🔐 User Validation

- Email format validation
- Password minimum 8 characters
- Duplicate email check
- Login with valid credentials

### ✅ MongoDB with Mongoose

- Fields: `id`, `name`, `email`, `password (hashed)`
- Passwords are securely hashed using `bcrypt`

### ⚠️ Class Validation & DTOs

- DTOs for:
  - `RegisterUserDto`
  - `LoginUserDto`
  - `UserResponseDto`
- `class-validator` used to enforce data integrity

### ✅ Middleware & Rate Limiting

- Custom logger middleware
- Rate limiting (5 requests/IP)

### ✅ Swagger Integration

- API documented via Swagger at `/api`

### ✅ Dockerized Environment

- Docker configuration as per requirement

## 🧪 Testing

✅ Unit tests for services

✅ Health checks for:

- Gateway

- Authentication microservice

- MongoDB connection

## 🛠 Setup Project

### 📁 Install Dependencies

```bash
$ npm install
```

## ▶️ Run Project

```bash
$ npm run start:auth:dev
```

```bash
$ npm run start:gateway:dev
```

## 🐳 Docker

```bash
$ docker-compose up --build
```

## 🔍 Swagger Documentation

```bash
 http://localhost:3000/api
```

## 📬 Postman Collection

🔗 Postman Collection: Tap to view

## 🧠 Notes

- Built in under 48 hours for a technical challenge

- No Clean or Hexagonal Architecture — uses Controller → Service → Repository pattern

- Emphasizes simplicity, clarity, modularity, and maintainability

- Built with 💡 NestJS best practices

## 👨‍💻 Author

Shiraz Shakeel
Software Engineer — Mobile & Web Developer
