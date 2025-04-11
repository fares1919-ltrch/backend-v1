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
  birthDate: { type: Date, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: { type: Number, required: true },
  cost: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed"],
    default: "pending"
  },
  officerDecision: {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    comments: String,
    decidedAt: Date,
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  appointmentDate: Date
}
```

## API Endpoints

### 1. Request Management

#### POST /api/cpf-requests
- **Description**: Create a new CPF request
- **Security**: Requires user authentication
- **Request Body**:
  - `identityNumber`: Unique identifier for the CPF
  - `birthDate`: User's birth date
  - `startDate`: Training start date
  - `endDate`: Training end date
  - `duration`: Training duration in hours
  - `cost`: Cost of the CPF
- **Response**: Created CPF request details

#### GET /api/cpf-requests
- **Description**: List all CPF requests with filtering
- **Security**: Requires user authentication
- **Query Parameters**:
  - `status`: Filter by request status
  - `startDate`: Filter by training start date
  - `endDate`: Filter by training end date
  - `page`: Pagination page number
  - `limit`: Number of items per page
- **Response**: List of CPF requests with pagination

#### GET /api/cpf-requests/user
- **Description**: Get user's own CPF request status
- **Security**: Requires user authentication
- **Response**: User's CPF request details

### 2. Officer Operations

#### GET /api/cpf-requests/pending
- **Description**: Get all pending CPF requests
- **Security**: Requires officer role
- **Query Parameters**:
  - `page`: Pagination page number
  - `limit`: Number of items per page
  - `sortBy`: Field to sort by
  - `order`: Sort order (asc/desc)
- **Response**: List of pending requests with pagination

#### PUT /api/cpf-requests/:id/status
- **Description**: Update CPF request status
- **Security**: Requires officer role
- **Request Body**:
  - `status`: New status (approved/rejected)
  - `comments`: Officer's comments
- **Response**: Updated request status details

### 3. Request Details

#### GET /api/cpf-requests/:id
- **Description**: Get CPF request by ID
- **Security**: Requires user authentication
- **Response**: Detailed CPF request information

#### DELETE /api/cpf-requests/:id
- **Description**: Delete CPF request
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