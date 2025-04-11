# CPF Process Flow Documentation

## Overview
This document outlines the complete flow of operations from center creation to appointment scheduling for CPF (Carte Professionnelle de Formation) requests.

## 1. Center Setup Flow

### 1.1 Create New Center
**Officer Role Required**
1. POST `/api/centers`
2. Provide center details:
   - Name
   - Address
   - Region
   - Capacity (daily/hourly)
   - Working hours (Monday-Sunday)
   - Status (active/inactive/maintenance)
   - Contact info
   - Services (cpf/biometric/document)
3. System validates:
   - Address format
   - Working hours
   - Capacity limits
   - Service availability
4. Center is created with status "active"

### 1.2 Center Management
1. Update center details:
   - PUT `/api/centers/:id`
   - Modify any field except ID
2. Monitor capacity:
   - Daily capacity
   - Hourly capacity
   - Working hours
3. Track center status:
   - Active: Normal operation
   - Inactive: Temporarily closed
   - Maintenance: Under maintenance

## 2. CPF Request Flow

### 2.1 Create CPF Request
**User Role Required**
1. POST `/api/cpf-requests`
2. Provide request details:
   - Identity number
   - Birth date
   - Training dates
   - Duration
   - Cost
3. System validates:
   - Unique identity number
   - Valid dates
   - No existing active requests
4. Request status: "pending"

### 2.2 Officer Review
**Officer Role Required**
1. GET `/api/cpf-requests/pending`
2. Review pending requests
3. Make decision:
   - PUT `/api/cpf-requests/:id/status`
   - Provide status (approved/rejected)
   - Add comments
4. Update request status:
   - Approved: Ready for appointment
   - Rejected: Request terminated

## 3. Appointment Scheduling Flow

### 3.1 Check Availability
**User/Officer Role Required**
1. GET `/api/appointments/slots`
2. Provide parameters:
   - Date
   - Center ID
3. System checks:
   - Center working hours
   - Existing appointments
   - Capacity limits
4. Returns available time slots

### 3.2 Schedule Appointment
**Officer Role Required**
1. POST `/api/appointments`
2. Provide details:
   - User ID
   - Officer ID
   - CPF Request ID
   - Appointment date
   - Location
3. System validates:
   - Available slots
   - Center capacity
   - User's active request
4. Appointment status: "scheduled"

### 3.3 Appointment Management
1. View appointments:
   - GET `/api/appointments/user` (for users)
   - GET `/api/appointments/officer/:officerId` (for officers)
   - GET `/api/appointments/center/:centerId/daily` (for centers)
2. Update status:
   - PUT `/api/appointments/:id/status`
   - Possible statuses: completed/cancelled/missed
3. Reschedule:
   - PUT `/api/appointments/:id/reschedule`
   - Provide new date and reason

## 4. Integration Points

### 4.1 Center-Appointment Integration
1. Capacity Management:
   - Daily capacity limits
   - Hourly capacity limits
   - Working hours validation
2. Status Synchronization:
   - Center status affects appointments
   - Maintenance periods block scheduling
   - Inactive centers prevent new appointments

### 4.2 Request-Appointment Link
1. Status Flow:
   - Request: pending → approved
   - Appointment: scheduled → completed
2. Data Consistency:
   - Link CPF request to appointment
   - Maintain status synchronization
   - Track appointment dates

## 5. Security Flow

### 5.1 Role-based Access
1. Centers:
   - Officers: Create/Update
   - Users: View active centers
2. CPF Requests:
   - Users: Create/View own
   - Officers: Review/Decide
3. Appointments:
   - Officers: Create/Manage
   - Users: View own

### 5.2 Data Protection
1. Center Information:
   - Protected address details
   - Working hours validation
   - Capacity limits
2. CPF Requests:
   - Unique identity numbers
   - Date validation
   - Status tracking
3. Appointments:
   - Slot validation
   - Capacity enforcement
   - Status updates

## 6. Error Handling Flow

### 6.1 Common Errors
1. Center-related:
   - Invalid address format
   - Working hours conflict
   - Capacity exceeded
2. Request-related:
   - Duplicate identity numbers
   - Invalid dates
   - Multiple active requests
3. Appointment-related:
   - Slot unavailable
   - Center capacity exceeded
   - Invalid status transitions

### 6.2 Error Responses
1. HTTP Status Codes:
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not Found
   - 500: Internal Server Error
2. Detailed error messages
3. Validation feedback

## 7. Best Practices

### 7.1 Center Management
1. Regular maintenance
2. Capacity planning
3. Working hour updates
4. Status monitoring

### 7.2 Request Processing
1. Thorough review
2. Proper documentation
3. Status tracking
4. User communication

### 7.3 Appointment Scheduling
1. Capacity management
2. Working hour validation
3. Status synchronization
4. User notifications

## 8. Future Enhancements

### 8.1 Center Features
1. Bulk operations
2. Regional management
3. Holiday scheduling
4. Capacity planning

### 8.2 Request Features
1. Request templates
2. Bulk processing
3. Request analytics
4. Automated validation

### 8.3 Appointment Features
1. Automated scheduling
2. Appointment reminders
3. Queue management
4. Waitlist system