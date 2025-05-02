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
- **Comprehensive file validation** for security:
  - File type (MIME) validation
  - Rejection of executable files (.exe, .dll, .bat, .cmd, .sh, etc.)
  - File size limits (max 10MB)
- **Extensive test coverage** for both unit and E2E tests
- **Performance stress testing** for concurrent upload scenarios

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
test/
├── app.e2e-spec.ts   # E2E tests for app endpoints
├── media.e2e-spec.ts # E2E tests for media operations and file validation
├── media.stress-spec.ts # Stress tests for concurrent uploads
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

## File Validation

The system implements the following security validations for file uploads:

### File Type Validation
- Whitelist of allowed MIME types:
  - Images: JPEG, PNG, GIF, WebP, SVG
  - Documents: PDF, Word, Excel, PowerPoint, TXT, CSV
  - Audio: MP3, WAV, OGG
  - Video: MP4, MPEG, WebM, QuickTime
  - Archives: ZIP, RAR

### Blacklisted File Extensions
The system rejects potentially dangerous file types, including:
- Executable files (.exe)
- DLL files (.dll)
- Batch scripts (.bat, .cmd)
- Shell scripts (.sh)
- System files (.sys, .com)
- Installation files (.msi, .app, .dmg)

### Size Limits
- Maximum file size: 10MB

## Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# stress tests for concurrent uploads
$ npm run test:e2e -- media.stress-spec.ts

# test coverage
$ npm run test:cov
```

### Test Coverage
- **Unit tests** cover controller methods, service interactions, and edge cases
- **E2E tests** cover:
  - File upload validation (file types, size limits)
  - CRUD operations for media entities
  - Error handling scenarios
- **Stress tests** cover:
  - Concurrent upload performance (10-50 simultaneous uploads)
  - Large file handling (up to 2MB)
  - Performance metrics collection (response times, success rates)

### Performance Benchmarks
The application has been tested to handle:
- 50+ concurrent uploads with 100% success rate
- Files of various sizes (10KB to 2MB)
- Average response times:
  - Small batch (10 uploads): ~125ms per request
  - Large batch (50 uploads): ~250ms per request
  - Large files (2MB): ~105ms per request

### Recent Updates (May 2025)
- Added comprehensive file validation to prevent security vulnerabilities
- Implemented extensive CRUD test coverage for media operations
- Fixed path alias resolution issues in Jest configuration for both unit and E2E tests
- Added E2E tests for file validation ensuring proper rejection of executable files
- Implemented stress testing framework for concurrent upload scenarios

## License

[MIT licensed](LICENSE).
