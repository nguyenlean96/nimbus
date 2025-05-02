<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# NestJS File Upload System

A robust file upload and media management system built with NestJS, TypeORM, and PostgreSQL.

## Features

- **RESTful API** for file uploads and media management
- **Automatic image processing** with thumbnail generation in multiple sizes (150px, 300px, 600px, 1200px)
- **Efficient storage** with organized file structure based on media IDs
- **PostgreSQL database** for metadata storage and retrieval
- **TypeORM integration** for database operations
- **Docker integration** for development environment setup
- **Static file serving** for easy access to uploaded media

## Project Structure

```
src/
├── base/             # Base entity classes
├── database/         # Database configuration
├── media/            # Media module for file storage and retrieval
│   ├── dto/          # Data transfer objects
│   ├── entities/     # Database entities
├── storage/          # Storage service for file handling
│   ├── disks/        # Disk storage configurations
│   ├── services/     # Storage services
```

## API Endpoints

| Method | Endpoint       | Description                           |
|--------|----------------|---------------------------------------|
| POST   | /media         | Upload a new file                     |
| GET    | /media         | Get all media items                   |
| GET    | /media/:id     | Get a specific media item by ID       |
| PATCH  | /media/:id     | Update media item metadata            |
| DELETE | /media/:id     | Delete a media item and its files     |

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Docker and Docker Compose (optional)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
$ npm install
```

3. Copy `.env.example` to `.env` and update the environment variables:

```bash
$ cp .env.example .env
```

4. Start the PostgreSQL database:

```bash
# Using Docker
$ docker compose up -d database

# Or configure your own PostgreSQL instance
```

5. Start the application:

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## File Upload Usage

The API accepts `multipart/form-data` with a file field named `file`:

```bash
curl -X POST http://localhost:3000/media \
  -F "file=@/path/to/your/image.jpg" \
  -F "collection=profile-pictures"
```

Response will include URLs to the original file and different thumbnail sizes:

```json
{
  "id": 1,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "original_image.jpg",
  "mimeType": "image/jpeg",
  "size": 1234567,
  "collection": "profile-pictures",
  "created_at": "2023-05-01T12:00:00Z",
  "updated_at": "2023-05-01T12:00:00Z",
  "urls": {
    "original": "/storage/1/original_image.jpg",
    "thumb": "/storage/1/thumb_image.jpg",
    "small": "/storage/1/small_image.jpg",
    "medium": "/storage/1/medium_image.jpg",
    "large": "/storage/1/large_image.jpg"
  }
}
```

## Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## License

[MIT licensed](LICENSE).
