# CPF Request System Documentation

## Overview
The CPF Request system manages the creation, approval, and management of CPF (Carte Professionnelle de Formation) requests. It integrates with user management and appointment systems to provide a complete workflow for CPF issuance.

## Data Model

### CPF Request Model
The core CPF request model includes the following fields:

```javascript
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  identityNumber: { type: String, required: true },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  cost: { type: String, default: "7.09 BRL" },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed"],
    default: "pending"
  },
  officerDecision: {
    status: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
    comment: String,
    decidedAt: Date,
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  appointmentDate: Date,
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

## API Endpoints

### 1. Request Management

#### POST /api/cpf-requests
- **Description**: Create a new CPF request
- **Security**: Requires user authentication
- **Request Body**:
  - `identityNumber`: Unique identifier for the CPF
  - `address`: Object containing street, city, state, postalCode, country, lat, lon
  - `cost`: Cost of the CPF request (optional)
  - `centerId`: ID of the center
- **Response**: Created CPF request details

#### GET /api/cpf-requests
- **Description**: List all CPF requests
- **Security**: Requires user authentication
- **Query Parameters**:
  - `status`: Filter by request status
  - `page`: Page number
  - `limit`: Items per page
  - `sortBy`: Sort field (createdAt/updatedAt)
  - `order`: Sort order (asc/desc)
- **Response**: Paginated list of CPF requests

### 2. Officer Operations

#### GET /api/cpf-requests/pending
- **Description**: Get all pending CPF requests
- **Security**: Requires officer role
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `sortBy`: Sort field
  - `order`: Sort order
- **Response**: List of pending CPF requests

#### PUT /api/cpf-requests/:id/status
- **Description**: Update CPF request status (officer only)
- **Security**: Requires officer role
- **Request Body**:
  - `status`: New status (approved/rejected)
  - `officerNotes`: Officer's comments
- **Response**: Updated request status details

### 3. Request Details

#### GET /api/cpf-requests/:id
- **Description**: Get CPF request by ID
- **Security**: Requires user authentication
- **Response**: Detailed CPF request information

#### DELETE /api/cpf-requests/:id
- **Description**: Delete user's pending CPF request
- **Security**: Requires user authentication
- **Response**: Confirmation message

## Business Logic

### Request Creation
1. Validates unique identity number
2. Checks date formats and ranges
3. Ensures only one active request per user
4. Validates training dates
5. Creates request record

### Status Management
1. Status flow:
   - Initial: pending
   - Officer review: pending → approved/rejected
   - Appointment: approved → completed
   - Completion: completed
2. Status updates trigger related actions:
   - Approved: Creates CPF credential
   - Rejected: Records officer's comments

### Validation Rules
1. Identity Number:
   - Must be unique per active request
   - Minimum length validation
2. Dates:
   - Birth date cannot be in the future
   - Training dates must be in the future
   - End date must be after start date
3. User Restrictions:
   - Only one active request per user
   - Only pending requests can be deleted

## Security Features

1. Role-based Access Control:
   - Users can only view their own requests
   - Only officers can update request decisions
   - Users can only delete their own pending requests

2. Data Protection:
   - All requests are tied to user accounts
   - Officer decisions are tracked with timestamps
   - Audit trail for all status changes

## Integration Points

1. User Management:
   - Links to user profiles
   - Role-based access control
   - User information population

2. Appointment System:
   - Links to appointment dates
   - Status synchronization
   - Appointment validation

3. CPF Credentials:
   - Creates credentials for approved requests
   - Links credentials to original requests
   - Maintains credential information

## Error Handling

1. Common Error Cases:
   - Invalid identity numbers
   - Invalid date formats
   - Duplicate requests
   - Unauthorized access
   - Invalid status transitions

2. Error Responses:
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not Found
   - 500: Internal Server Error

## Best Practices

1. Request Management:
   - Always validate user permissions
   - Check for existing active requests
   - Validate all date formats
   - Maintain proper audit trail

2. Officer Operations:
   - Record detailed decision comments
   - Maintain consistent status updates
   - Track all decision timestamps
   - Properly link officer decisions

3. System Integration:
   - Synchronize status changes
   - Maintain data consistency
   - Handle concurrent updates
   - Implement proper error handling

## Future Enhancements

1. Request Management:
   - Add bulk request processing
   - Implement request templates
   - Add request categorization
   - Implement request history

2. Officer Tools:
   - Add batch approval/rejection
   - Implement decision templates
   - Add request analytics
   - Implement decision statistics

3. User Experience:
   - Add request tracking
   - Implement request notifications
   - Add request documentation
   - Implement request history

4. System Features:
   - Add request validation rules
   - Implement request automation
   - Add request reporting
   - Implement request archiving