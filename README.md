# Employee Management System API

This is a RESTful API for an Employee Management System built with Node.js, Express, TypeScript, and PostgreSQL using Sequelize ORM.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Setup](#setup)
3. [API Endpoints](#api-endpoints)
4. [Authentication](#authentication)
5. [Models](#models)
6. [Environment Variables](#environment-variables)
7. [Docker Setup](#docker-setup)

## Project Structure

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see [Environment Variables](#environment-variables))
4. Run the development server: `npm run start`

## API Endpoints

### User Routes

- `POST /api/users/register`: Register a new user
- `POST /api/users/login`: Login a user
- `GET /api/users`: Get all users (Admin only)
- `GET /api/users/:id`: Get a specific user (Admin or the user themselves)
- `PUT /api/users/:id`: Update a user (Admin or the user themselves)
- `DELETE /api/users/:id`: Delete a user (Admin only)

### Employee Routes

- `GET /api/employees`: Get all employees
- `GET /api/employees/:id`: Get a specific employee
- `POST /api/employees`: Create a new employee (Admin only)
- `PUT /api/employees/:id`: Update an employee (Admin only)
- `DELETE /api/employees/:id`: Delete an employee (Admin only)

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. To access protected routes, include the JWT token in the Authorization header of your request:

## Models

### User

- `id`: number (auto-generated)
- `email`: string (unique)
- `passwordHash`: string
- `role`: enum ("ADMIN" | "USER")

### Employee

- `id`: number (auto-generated)
- `name`: string
- `phone`: string
- `salary`: number

### WorkSchedule

- `id`: number (auto-generated)
- `employeeId`: number (foreign key to Employee)
- `workday`: enum ("MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY")
- `workStartTime`: Date
- `workEndTime`: Date

## Environment Variables

Create a `.env` file in the root directory with the following variables:

## Docker Setup

This project includes a Docker setup for easy development and deployment.

1. Make sure you have Docker and Docker Compose installed on your machine.
2. Run `docker-compose up --build` to start the application and database containers.
3. The API will be available at `http://localhost:3000`.

Note: The Docker setup uses the development Dockerfile (`Dockerfile.dev`) and mounts the local directory for hot reloading during development.

## Scripts

- `npm run start`: Start the development server with hot reloading
- `npm run debug`: Start the server in debug mode
- `npm run build`: Build the TypeScript code

## Dependencies

- Node.js: 20.18.0
- Express: Web framework for Node.js
- Sequelize: ORM for PostgreSQL
- bcrypt: Password hashing
- jsonwebtoken: JWT authentication
- dotenv: Environment variable management
- TypeScript: Static typing for JavaScript

## Development Dependencies

- nodemon: Hot reloading for development
- ts-node: TypeScript execution for Node.js
- Various TypeScript type definitions (@types/\*)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
