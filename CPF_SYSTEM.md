# CPF (Continuing Professional Formation) System Documentation

## System Overview

The CPF system manages professional formation requests and credentials with biometric verification. It supports three user roles:
- **User**: Can create and track CPF requests
- **Officer**: Can approve requests and collect biometric data
- **Manager**: Has view-only access to requests

## Technical Stack
- Backend: Node.js with Express
- Database: MongoDB with Mongoose
- Authentication: JWT
- File Handling: Multer
- Image Processing: Sharp
- Security: Helmet, Rate Limiting

## System Flow

### 1. CPF Request Process

#### 1.1 User Creates CPF Request
1. User submits request with:
   - Identity information
   - Birth date
   - Training details (start date, end date, duration, cost)
2. System validates:
   - No existing active requests
   - Valid identity number
   - Valid dates
   - Required fields

#### 1.2 Officer Reviews Request
1. Officer reviews submitted request
2. Can approve or reject with comments
3. If approved, schedules biometric collection

### 2. Biometric Collection Process

#### 2.1 Required Biometrics
- Fingerprints (minimum 2 fingers)
- Facial photograph
- Optional iris scans
- Supporting documents

#### 2.2 Collection Steps
1. Officer verifies user identity
2. Captures biometric data
3. System validates quality
4. Data is securely stored

### 3. CPF Credential Issuance
1. After successful biometric collection
2. System generates unique CPF number
3. Credential is issued with validity period
4. Request status updated to "completed"

## API Endpoints

### 1. CPF Request Endpoints

#### Create CPF Request
```http
POST /api/cpf-requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "identityNumber": "ID123456",
  "birthDate": "1990-01-01",
  "startDate": "2025-05-01T00:00:00.000Z",
  "endDate": "2025-05-30T00:00:00.000Z",
  "duration": 40,
  "cost": 1500
}

Response (201 Created):
{
  "id": "507f1f77bcf86cd799439011",
  "status": "pending",
  "userId": "507f1f77bcf86cd799439012",
  "createdAt": "2025-04-10T10:00:00.000Z"
}
```

#### Get User's CPF Request
```http
GET /api/cpf-requests/user
Authorization: Bearer <token>

Response (200 OK):
{
  "id": "507f1f77bcf86cd799439011",
  "status": "pending",
  "identityNumber": "ID123456",
  "birthDate": "1990-01-01",
  "startDate": "2025-05-01T00:00:00.000Z",
  "endDate": "2025-05-30T00:00:00.000Z",
  "duration": 40,
  "cost": 1500,
  "officerDecision": {
    "status": "pending"
  }
}
```

#### Get All CPF Requests (Officer)
```http
GET /api/cpf-requests
Authorization: Bearer <token>
Query Parameters:
- status: pending | approved | rejected | completed (optional)
- page: number (optional, default: 1)
- limit: number (optional, default: 10)

Response (200 OK):
{
  "requests": [
    {
      "id": "507f1f77bcf86cd799439011",
      "status": "pending",
      "userId": {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "identityNumber": "ID123456",
      "birthDate": "1990-01-01",
      "startDate": "2025-05-01T00:00:00.000Z",
      "endDate": "2025-05-30T00:00:00.000Z",
      "duration": 40,
      "cost": 1500,
      "createdAt": "2025-04-10T10:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 5
}
```

#### Update CPF Request Status (Officer)
```http
PUT /api/cpf-requests/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",
  "comments": "All documents verified",
  "appointmentDate": "2025-04-15T09:00:00.000Z"  // Required if status is "approved"
}

Response (200 OK):
{
  "id": "507f1f77bcf86cd799439011",
  "status": "approved",
  "officerDecision": {
    "status": "approved",
    "comments": "All documents verified",
    "decidedBy": "507f1f77bcf86cd799439014",
    "decidedAt": "2025-04-10T10:05:00.000Z"
  }
}
```

### 2. Appointment Endpoints

#### Get Available Time Slots (User/Officer)
```http
GET /api/appointments/slots
Authorization: Bearer <token>
Query Parameters:
- date: YYYY-MM-DD
- center: string (collection center id)

Response (200 OK):
{
  "date": "2025-04-15",
  "center": "001",
  "slots": [
    {
      "time": "09:00",
      "available": true
    },
    {
      "time": "09:30",
      "available": false
    }
  ]
}
```

#### Get User's Appointment
```http
GET /api/appointments/user
Authorization: Bearer <token>

Response (200 OK):
{
  "id": "507f1f77bcf86cd799439016",
  "cpfRequestId": "507f1f77bcf86cd799439011",
  "date": "2025-04-15T09:00:00.000Z",
  "center": {
    "id": "001",
    "name": "Center 1",
    "address": "123 Main St"
  },
  "status": "scheduled"
}
```

#### Get Center's Daily Appointments (Officer)
```http
GET /api/appointments/center/:centerId/daily
Authorization: Bearer <token>
Query Parameters:
- date: YYYY-MM-DD

Response (200 OK):
{
  "date": "2025-04-15",
  "center": {
    "id": "001",
    "name": "Center 1"
  },
  "appointments": [
    {
      "id": "507f1f77bcf86cd799439016",
      "time": "09:00",
      "user": {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe"
      },
      "status": "scheduled"
    }
  ]
}
```

#### Update Appointment Status (Officer)
```http
PUT /api/appointments/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "comments": "Biometric data collected successfully"
}

Response (200 OK):
{
  "id": "507f1f77bcf86cd799439016",
  "status": "completed",
  "updatedAt": "2025-04-15T09:30:00.000Z",
  "updatedBy": "507f1f77bcf86cd799439014"
}
```

#### Reschedule Appointment (User/Officer)
```http
PUT /api/appointments/:id/reschedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "newDate": "2025-04-16T10:00:00.000Z",
  "reason": "Emergency situation"
}

Response (200 OK):
{
  "id": "507f1f77bcf86cd799439016",
  "oldDate": "2025-04-15T09:00:00.000Z",
  "newDate": "2025-04-16T10:00:00.000Z",
  "status": "rescheduled",
  "updatedAt": "2025-04-10T11:00:00.000Z"
}
```

### 3. Collection Center Endpoints

#### Get All Centers
```http
GET /api/centers
Authorization: Bearer <token>

Response (200 OK):
{
  "centers": [
    {
      "id": "001",
      "name": "Center 1",
      "region": "01",
      "address": "123 Main St",
      "capacity": 20,
      "workingHours": {
        "start": "09:00",
        "end": "17:00"
      }
    }
  ]
}
```

#### Get Center Statistics (Officer)
```http
GET /api/centers/:id/stats
Authorization: Bearer <token>
Query Parameters:
- startDate: YYYY-MM-DD
- endDate: YYYY-MM-DD

Response (200 OK):
{
  "centerId": "001",
  "period": {
    "start": "2025-04-01",
    "end": "2025-04-30"
  },
  "stats": {
    "totalAppointments": 450,
    "completed": 400,
    "rescheduled": 30,
    "noShow": 20,
    "averageProcessingTime": 25,
    "biometricCollectionSuccess": 98.5
  }
}
```

### 4. Biometric Data Endpoints

#### Submit Biometric Data (Officer)
```http
POST /api/biometric-data
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
- fingerprint_right_thumb: file
- fingerprint_right_index: file
- face: file
- iris_right: file (optional)
- iris_left: file (optional)
- document: file (up to 5 files)
- fingerprintScanner: string
- camera: string
- collectionCenter: string

Response (201 Created):
{
  "id": "507f1f77bcf86cd799439013",
  "userId": "507f1f77bcf86cd799439012",
  "verificationStatus": "pending",
  "collectedAt": "2025-04-10T10:00:00.000Z"
}
```

#### Verify Biometric Quality (Officer)
```http
POST /api/biometric-data/:id/verify
Authorization: Bearer <token>

Response (200 OK):
{
  "status": "verified",
  "qualityCheck": {
    "fingerprints": true,
    "face": true,
    "iris": true
  },
  "verificationDetails": {
    "verifiedBy": "507f1f77bcf86cd799439014",
    "verifiedAt": "2025-04-10T10:05:00.000Z"
  }
}
```

### 5. Additional CPF Request Endpoints

#### Upload Completion Certificate (User)
```http
POST /api/cpf-requests/:id/completion
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
- certificate: file (PDF/JPG/PNG, max 5MB)
- completionDate: YYYY-MM-DD

Response (200 OK):
{
  "id": "507f1f77bcf86cd799439011",
  "status": "completed",
  "completionCertificate": {
    "url": "/uploads/certificates/cert123.pdf",
    "uploadedAt": "2025-04-10T10:00:00.000Z",
    "verifiedAt": null
  }
}
```

#### Get CPF Request History (User/Officer)
```http
GET /api/cpf-requests/history
Authorization: Bearer <token>
Query Parameters:
- status: all | completed | revoked (optional)
- startDate: YYYY-MM-DD (optional)
- endDate: YYYY-MM-DD (optional)
- page: number (optional)
- limit: number (optional)

Response (200 OK):
{
  "requests": [
    {
      "id": "507f1f77bcf86cd799439011",
      "status": "completed",
      "cpfNumber": "012504010010001",
      "issuedAt": "2025-04-10T10:00:00.000Z",
      "completedAt": "2025-05-30T10:00:00.000Z",
      "certificate": {
        "verified": true,
        "verifiedAt": "2025-05-30T11:00:00.000Z"
      }
    }
  ],
  "total": 5,
  "page": 1,
  "totalPages": 1
}
```

#### Get CPF Statistics (Officer)
```http
GET /api/cpf-requests/stats
Authorization: Bearer <token>
Query Parameters:
- startDate: YYYY-MM-DD
- endDate: YYYY-MM-DD
- region: string (optional)

Response (200 OK):
{
  "period": {
    "start": "2025-04-01",
    "end": "2025-04-30"
  },
  "stats": {
    "totalRequests": 500,
    "approved": 400,
    "rejected": 50,
    "pending": 50,
    "completionRate": 80,
    "averageProcessingDays": 5.2,
    "byRegion": [
      {
        "region": "01",
        "total": 200,
        "approved": 160
      }
    ]
  }
}
```

#### Revoke CPF Credential (Officer)
```http
POST /api/cpf-credentials/:id/revoke
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Fraudulent documentation",
  "effectiveDate": "2025-04-10T00:00:00.000Z"
}

Response (200 OK):
{
  "id": "507f1f77bcf86cd799439015",
  "status": "revoked",
  "revocationDetails": {
    "reason": "Fraudulent documentation",
    "revokedBy": "507f1f77bcf86cd799439014",
    "revokedAt": "2025-04-10T10:00:00.000Z",
    "effectiveDate": "2025-04-10T00:00:00.000Z"
  }
}
```

### 6. CPF Number Format

The CPF number is generated using a secure algorithm that combines:
1. User's identity information (name, birth date, ID number)
2. Check digits for validation

Format: `XXX.XXX.XXX-XX`
- First 9 digits: Generated from user data using a deterministic hashing algorithm
- Last 2 digits: Check digits calculated using modulo 11 algorithm

Examples:
- `123.456.789-09`
- `987.654.321-00`
- `111.222.333-44`

Note: The check digits help detect transcription errors and validate CPF numbers.

### 3. CPF Credential Endpoints

#### CPF Number Format
The CPF number follows this format: `[Region Code][YY][MM][DD][3-digit center][4-digit sequence]`
- Region Code: 2-digit region identifier (01-99)
- YY: Last 2 digits of issue year
- MM: 2-digit issue month
- DD: 2-digit issue day
- Center: 3-digit collection center code
- Sequence: 4-digit sequence number (resets daily per center)

Examples:
- `012504010010001` (Region 01, April 1, 2025, Center 001, sequence 0001)
- `012504010020001` (Region 01, April 1, 2025, Center 002, sequence 0001)
- `022504020010123` (Region 02, April 2, 2025, Center 001, sequence 0123)

Note: Each collection center can issue up to 9,999 CPFs per day. The numbers are sequential within each center and reset daily.

#### Issue Credential (Officer)
```http
POST /api/cpf-credentials
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439012",
  "cpfRequestId": "507f1f77bcf86cd799439011",
  "validUntil": "2026-04-10T00:00:00.000Z"
}

Response (201 Created):
{
  "id": "507f1f77bcf86cd799439015",
  "cpfNumber": "012504010010001",
  "status": "active",
  "issuedAt": "2025-04-10T10:10:00.000Z",
  "validUntil": "2026-04-10T00:00:00.000Z"
}
```

#### Verify Credential
```http
POST /api/cpf-credentials/verify
Content-Type: application/json

{
  "cpfNumber": "012504010010001"
}

Response (200 OK):
{
  "valid": true,
  "holder": {
    "id": "507f1f77bcf86cd799439012",
    "name": "John Doe"
  },
  "validUntil": "2026-04-10T00:00:00.000Z"
}
```

## File Formats and Limitations

### Biometric Data
1. **Fingerprints**:
   - Formats: JPEG, PNG, WSQ
   - Max size: 2MB per print
   - Min resolution: 500 DPI
   - Quality threshold: 60/100

2. **Face Photo**:
   - Formats: JPEG, PNG
   - Max size: 5MB
   - Min dimensions: 600x800
   - Quality threshold: 70/100

3. **Iris Scans**:
   - Formats: JPEG, PNG
   - Max size: 3MB
   - Quality threshold: 60/100

4. **Supporting Documents**:
   - Formats: PDF, JPEG, PNG
   - Max size: 5MB per document
   - Max documents: 5

## Security Measures

1. **Authentication**:
   - JWT-based authentication
   - Role-based access control
   - Token refresh mechanism

2. **Data Protection**:
   - Biometric data encryption
   - Secure file storage
   - Rate limiting
   - Helmet security headers

3. **Quality Control**:
   - Automated quality assessment
   - Manual verification by officers
   - Multi-step validation process

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

Error responses include detailed messages:
```json
{
  "message": "Error description",
  "error": "Specific error details"
}
