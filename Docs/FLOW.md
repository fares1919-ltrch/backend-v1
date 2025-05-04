# CPF Process Flow Documentation

## Overview
This document outlines the complete flow of operations from user profile management to CPF (Carte Professionnelle de Formation) credential issuance, including biometric data collection and center management.

## 1. User Profile Management Flow

### 1.1 Profile Creation and Management
**User Role Required**
1. POST `/api/auth/signup` (Initial profile creation)
2. Provide user details:
   - Username
   - Email
   - Password
   - Optional: First name, Last name, Address
3. System validates:
   - Unique username/email
   - Password strength
   - Required fields
4. Profile is created with default role "user"

### 1.2 Profile Updates
**User Role Required**
1. PUT `/api/profile`
2. Update allowed fields:
   - First name
   - Last name
   - Address
   - About me
   - Work information
   - Birth date
   - Identity number
3. System validates:
   - Address format (if provided)
   - Identity number format
   - Birth date validity

### 1.3 Profile Validation for CPF
**User Role Required**
1. GET `/api/profile/validate-cpf`
2. System checks required fields:
   - First name
   - Last name
   - Birth date
   - Identity number
   - Location (optional but recommended)
3. Returns validation status:
   - Complete: Ready for CPF request
   - Incomplete: Missing fields listed
   - Location needed: Map selection required

### 1.4 Account Linking and Sessions
**User Role Required**
1. Link OAuth accounts:
   - POST `/api/profile/link-oauth`
   - Provide provider and provider ID
2. Manage active sessions:
   - GET `/api/profile/sessions`
   - DELETE `/api/profile/sessions/:token`

## 2. Center Setup Flow

### 2.1 Create New Center
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

### 2.2 Center Management
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

## 3. CPF Request Flow

### 3.1 Create CPF Request
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
   - Profile completeness
4. Request status: "pending"

### 3.2 Officer Review
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

## 4. Biometric Data Collection Flow

### 4.1 Schedule Biometric Collection
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

### 4.2 Collect Biometric Data
**Officer Role Required**
1. POST `/api/biometric-data`
2. Provide biometric data:
   - Fingerprints (minimum required count)
   - Face photo
   - Iris scans (optional)
   - Supporting documents
3. System processes:
   - Image quality validation
   - Format conversion
   - Data encryption
4. Biometric data is stored securely

### 4.3 Verify Biometric Quality
**Officer Role Required**
1. POST `/api/biometric-data/:id/verify`
2. System checks:
   - Fingerprint quality (minimum 60%)
   - Face photo quality (minimum 70%)
   - Iris scan quality (minimum 60% if provided)
3. Update verification status:
   - Verified: Quality standards met
   - Requires review: Quality issues detected

## 5. CPF Credential Issuance Flow

### 5.1 Issue CPF Credential
**Officer Role Required**
1. POST `/api/cpf-credentials`
2. System validates:
   - Approved CPF request
   - Completed biometric collection
   - Verified biometric quality
3. Generate credential:
   - Unique CPF number
   - Issue date
   - Expiry date (10 years)
4. Credential status: "active"

### 5.2 Verify CPF Credential
**Public/Officer Role Required**
1. GET `/api/cpf-credentials/:id/verify`
2. System checks:
   - Credential validity
   - Expiry date
   - Revocation status
   - Biometric verification
3. Returns verification result:
   - Valid: Credential is active and not expired
   - Invalid: Expired or revoked

### 5.3 Revoke CPF Credential
**Officer Role Required**
1. PUT `/api/cpf-credentials/:id/revoke`
2. Provide revocation reason
3. System updates:
   - Credential status to "revoked"
   - Revocation date and reason
   - Revoking officer

## 6. Appointment Scheduling Flow

### 6.1 Check Availability
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

### 6.2 Appointment Management
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

## 7. Integration Points

### 7.1 Profile-Request Integration
1. Data Validation:
   - Profile completeness check
   - Identity verification
   - Location validation
2. Status Synchronization:
   - Profile updates affect request validity
   - Request status affects credential issuance

### 7.2 Center-Appointment Integration
1. Capacity Management:
   - Daily capacity limits
   - Hourly capacity limits
   - Working hours validation
2. Status Synchronization:
   - Center status affects appointments
   - Maintenance periods block scheduling
   - Inactive centers prevent new appointments

### 7.3 Request-Appointment-Biometric Link
1. Status Flow:
   - Request: pending → approved
   - Appointment: scheduled → completed
   - Biometric: collected → verified
2. Data Consistency:
   - Link CPF request to appointment
   - Link appointment to biometric data
   - Maintain status synchronization

## 8. Security Flow

### 8.1 Role-based Access
1. Profiles:
   - Users: Manage own profile
   - Officers: View user profiles
2. Centers:
   - Officers: Create/Update
   - Users: View active centers
3. CPF Requests:
   - Users: Create/View own
   - Officers: Review/Decide
4. Biometric Data:
   - Officers: Collect/Verify
   - Users: View own (limited)
5. CPF Credentials:
   - Officers: Issue/Revoke
   - Users: View own
   - Public: Verify (limited info)

### 8.2 Data Protection
1. Profile Information:
   - Protected personal data
   - Encrypted sensitive fields
   - Session management
2. Biometric Data:
   - Encrypted storage
   - Access logging
   - Quality validation
3. CPF Credentials:
   - Secure issuance
   - Revocation tracking
   - Verification system

## 9. Error Handling Flow

### 9.1 Common Errors
1. Profile-related:
   - Missing required fields
   - Invalid address format
   - Duplicate identity numbers
2. Center-related:
   - Invalid address format
   - Working hours conflict
   - Capacity exceeded
3. Request-related:
   - Duplicate identity numbers
   - Invalid dates
   - Multiple active requests
4. Biometric-related:
   - Poor quality images
   - Missing required biometrics
   - Processing errors
5. Appointment-related:
   - Slot unavailable
   - Center capacity exceeded
   - Invalid status transitions

### 9.2 Error Responses
1. HTTP Status Codes:
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not Found
   - 500: Internal Server Error
2. Detailed error messages
3. Validation feedback

## 10. Best Practices

### 10.1 Profile Management
1. Complete information
2. Regular updates
3. Identity verification
4. Session security

### 10.2 Center Management
1. Regular maintenance
2. Capacity planning
3. Working hour updates
4. Status monitoring

### 10.3 Request Processing
1. Thorough review
2. Proper documentation
3. Status tracking
4. User communication

### 10.4 Biometric Collection
1. Quality standards
2. Proper equipment
3. Environment control
4. Data security

### 10.5 Credential Management
1. Secure issuance
2. Regular verification
3. Proper revocation
4. Audit logging

## 11. Future Enhancements

### 11.1 Profile Features
1. Enhanced verification
2. Document upload
3. Profile analytics
4. Automated updates

### 11.2 Center Features
1. Bulk operations
2. Regional management
3. Holiday scheduling
4. Capacity planning

### 11.3 Request Features
1. Request templates
2. Bulk processing
3. Request analytics
4. Automated validation

### 11.4 Biometric Features
1. Advanced quality checks
2. Automated processing
3. Multi-device support
4. Real-time verification

### 11.5 Credential Features
1. Digital credentials
2. QR code verification
3. Automated renewal
4. Credential analytics