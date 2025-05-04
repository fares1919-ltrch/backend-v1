# CPF Request Flow Process

This document outlines the complete flow of a CPF (Cadastro de Pessoas Físicas) request from submission to issuance in our system.

## Overview

The CPF issuance process is designed to be secure, efficient, and compliant with regulatory requirements. It involves multiple steps and stakeholders, including users, officers, and system administrators.

## Process Flow Diagram

```
┌───────────────────┐          ┌───────────────────┐          ┌───────────────────┐          ┌───────────────────┐
│                   │          │                   │          │                   │          │                   │
│     USER          │          │     OFFICER       │          │     MANAGER       │          │     SYSTEM        │
│                   │          │                   │          │                   │          │                   │
└─────────┬─────────┘          └─────────┬─────────┘          └─────────┬─────────┘          └─────────┬─────────┘
          │                              │                              │                              │
          ▼                              │                              │                              │
┌───────────────────┐                    │                              │                              │
│   Submit CPF      │                    │                              │                              │
│    Request        │                    │                              │                              │
└─────────┬─────────┘                    │                              │                              │
          │                              │                              │                              │
          ▼                              │                              │                              │
┌───────────────────┐                    │                              │                              │
│  Select Service   │                    │                              │                              │
│     Center        │                    │                              │                              │
└─────────┬─────────┘                    │                              │                              │
          │                              │                              │                              │
          │                              │                              │                              │
          │                              │                              │                              │
          │                              │                              │                    ┌───────────────────┐
          │                              │                              │                    │   Validate        │
          │                              │                              │                    │   Request Data    │
          │                              │                              │                    └─────────┬─────────┘
          │                              │                              │                              │
          │                              │                              │                              ▼
          │                              │                              │                    ┌───────────────────┐
          │                              │                              │                    │  Set Request      │
          │                              │                              │                    │  Status: PENDING  │
          │                              │                              │                    └─────────┬─────────┘
          │                              │                              │                              │
          │                              ▼                              │                              │
          │                    ┌───────────────────┐                    │                              │
          │                    │  Review Request   │                    │                              │
          │                    │                   │                    │                              │
          │                    └─────────┬─────────┘                    │                              │
          │                              │                              │                              │
          │                              ▼                              │                              │
          │                    ┌───────────────────┐                    │                              │
          │                    │ Make Decision     │                    │                              │
          │                    │ (Approve/Reject)  │                    │                              │
          │                    └─────────┬─────────┘                    │                              │
          │                              │                              │                              │
          │                              │                              │                              ▼
          │                              │                              │                    ┌───────────────────┐
          │                              │                              │                    │ Update Request    │
          │                              │                              │                    │ Status            │
          │                              │                              │                    └─────────┬─────────┘
          ▼                              │                              │                              │
┌───────────────────┐                    │                              │                              │
│ Receive           │                    │                              │                              │
│ Notification      │◄───────────────────┼──────────────────────────────┼──────────────────────────────┘
└─────────┬─────────┘                    │                              │
          │                              │                              │
          ▼                              │                              │
┌───────────────────┐                    │                              │
│ Book Appointment  │                    │                              │
│ (if approved)     │                    │                              │
└─────────┬─────────┘                    │                              │
          │                              │                              │
          ▼                              │                              │
┌───────────────────┐                    │                              │
│ Visit Center for  │                    │                              │
│ Appointment       │                    │                              │
└─────────┬─────────┘                    │                              │
          │                              │                              │
          │                              ▼                              │
          │                    ┌───────────────────┐                    │
          │                    │ Verify Identity   │                    │
          │                    │                   │                    │
          │                    └─────────┬─────────┘                    │
          │                              │                              │
          │                              ▼                              │
          │                    ┌───────────────────┐                    │
          │                    │ Collect Biometric │                    │
          │                    │ Data              │                    │
          │                    └─────────┬─────────┘                    │
          │                              │                              │
          │                              ▼                              │
          │                    ┌───────────────────┐                    │
          │                    │ Verify Biometric  │                    │
          │                    │ Data Quality      │                    │
          │                    └─────────┬─────────┘                    │
          │                              │                              │
          │                              │                              │
          │                              │                              ▼
          │                              │                    ┌───────────────────┐
          │                              └────────────────────► Review Biometric  │
          │                                                   │ Data              │
          │                                                   └─────────┬─────────┘
          │                                                             │
          │                                                             ▼
          │                                                   ┌───────────────────┐
          │                                                   │ Trigger           │
          │                                                   │ Deduplication     │
          │                                                   └─────────┬─────────┘
          │                                                             │
          │                                                             ▼
          │                                                   ┌───────────────────┐
          │                                                   │ Review            │
          │                                                   │ Results           │
          │                                                   └─────────┬─────────┘
          │                                                             │
          │                                                             ▼
          │                                                   ┌───────────────────┐
          │                                                   │ Decision:         │
          │                                                   │ Unique or Fraud?  │
          │                                                   └─────────┬─────────┘
          │                                                             │
          │                                                             ├─────────────────┐
          │                                                             │                 │
          │                                                             ▼                 ▼
          │                                                   ┌───────────────────┐      ┌───────────────────┐
          │                                                   │ Generate          │      │ Report Fraud      │
          │                                                   │ Document          │      │                   │
          │                                                   └─────────┬─────────┘      └─────────┬─────────┘
          │                                                             │                          │
          │                                                             │                          ▼
          │                                                             │                ┌───────────────────┐
          │                                                             │                │ Block User        │
          │                                                             │                │                   │
          │                                                             │                └─────────┬─────────┘
          │                                                             │                          │
          │                                                             │                          ▼
          │                                                             │                ┌───────────────────┐
          │                                                             │                │ Notify Officer    │
          │                                                             │                │                   │
          │                                                             │                └───────────────────┘
          │                                                             │
          │                                                             ▼
          │                                                   ┌───────────────────┐
          │                                                   │ Create Credential │
          │                                                   │ Record            │
          │                                                   └─────────┬─────────┘
          │                                                             │
          │                                                             ▼
          │                                                   ┌───────────────────┐
          │                                                   │ Set Request       │
          │                                                   │ Status: COMPLETED │
          │                                                   └─────────┬─────────┘
          ▼                                                             │
┌───────────────────┐                                                   │
│ Receive CPF       │◄──────────────────────────────────────────────────┘
│ Credential        │
└───────────────────┘
```

## Detailed Process Steps

### 1. User CPF Request Submission

**Actor:** User (Citizen)

**Steps:**

1. User logs in to the system
2. User navigates to the CPF request section
3. User fills out the CPF request form:
   - Personal information
   - Identity verification details
   - Address information
4. User selects a service center from available locations
5. User submits the request

**System Actions:**

- Validates all input data
- Checks for duplicate requests
- Validates identity number format
- Creates a new CPF request record with status "pending"
- Sends confirmation notification to user

### 2. Officer Review Process

**Actor:** Officer

**Steps:**

1. Officer logs in to the officer portal
2. Officer views list of pending CPF requests
3. Officer selects a request to review
4. Officer reviews submitted information
5. Officer makes a decision:
   - Approve: If all information is correct and verified
   - Reject: If information is incorrect or suspicious

**System Actions:**

- Updates request status to "approved" or "rejected"
- Records officer decision details (timestamp, officer ID, comments)
- If approved, automatically creates an appointment record
- Sends notification to user about the decision

### 3. Appointment Scheduling (if approved)

**Actor:** User

**Steps:**

1. User receives notification about approved request
2. User views available appointment slots
3. User selects preferred date and time
4. User confirms appointment

**System Actions:**

- Validates slot availability
- Reserves the appointment slot
- Creates appointment record linking to CPF request
- Sends confirmation and reminders to user

### 4. Biometric Data Collection

**Actor:** Officer

**Steps:**

1. User arrives at service center for appointment
2. Officer verifies user identity
3. Officer marks appointment as "in progress"
4. Officer collects biometric data:
   - Fingerprints (all ten fingers)
   - Facial photograph
   - Signature
   - Supporting documents
5. Officer verifies quality of collected data
6. Officer submits collected data

**System Actions:**

- Validates biometric data quality
- Associates biometric data with user profile and CPF request
- Updates appointment status to "completed"

### 5. Biometric Deduplication

**Actor:** Manager

**Steps:**

1. Manager receives notification of completed biometric collection
2. Manager reviews collected biometric data
3. Manager triggers deduplication process
4. System sends biometric data to external API for deduplication
5. System receives and processes deduplication results
6. Manager reviews deduplication results
7. Manager makes decision:
   - If no duplicates found: Proceed to document generation
   - If duplicates found: Investigate potential fraud

### 6. Fraud Detection and Reporting (if duplicates found)

**Actor:** Manager

**Steps:**

1. Manager reviews duplicate matches
2. Manager confirms fraud case
3. Manager creates fraud report with evidence
4. Manager selects blocking criteria (email, identity number, face)
5. System blocks user based on selected criteria
6. System notifies officer about fraud detection
7. System updates CPF request status to "fraud"

### 7. Document Generation (if no duplicates)

**Actor:** Manager

**Steps:**

1. Manager confirms biometric verification
2. Manager selects document template
3. Manager reviews auto-filled information
4. Manager generates official document
5. System stores document and links to user's account
6. System updates CPF request status to "verified"

### 8. CPF Issuance

**Actor:** System

**Steps:**

1. System verifies all required steps are completed
2. System generates unique CPF number
3. System creates CPF credential record
4. System updates CPF request status to "completed"
5. System generates verification code for the credential
6. System notifies user of CPF issuance

**Actor:** User

**Steps:**

1. User receives notification of issued CPF
2. User can view and download digital CPF credential
3. User may receive physical CPF card (if applicable)

## Status Transitions

A CPF request progresses through the following statuses:

1. **Pending**: Initial state after submission
2. **Approved**: Officer has reviewed and approved the request
3. **Rejected**: Officer has reviewed and rejected the request
4. **Biometric_Collected**: Biometric data has been collected
5. **Verification_Pending**: Awaiting biometric verification
6. **Verified**: Biometric data verified, no duplicates found
7. **Fraud**: Biometric data matched with existing records, fraud detected
8. **Document_Generated**: Official document has been generated
9. **Completed**: CPF has been issued successfully

## Special Cases

### Request Rejection

If a request is rejected:

1. User is notified with rejection reason
2. User may submit a new request addressing the issues
3. Previous request remains in system with "rejected" status

### Appointment Rescheduling

If a user needs to reschedule:

1. User cancels current appointment (up to 24 hours before)
2. User selects new appointment slot
3. System updates appointment records

### Biometric Data Issues

If biometric data has quality issues:

1. Officer marks specific data for re-collection
2. User provides biometric data again
3. System validates new data quality

### Fraud Detection

If fraud is detected during deduplication:

1. Manager creates detailed fraud report
2. System blocks user based on specified criteria (email, identity number, face)
3. Officer is notified about the fraud case
4. CPF request is marked as "fraud"
5. Any existing CPF credentials may be revoked if necessary

### Manual Verification Override

In case of false positive in deduplication:

1. Manager reviews potential matches carefully
2. Manager determines it's not a fraud case
3. Manager provides justification for override
4. Manager manually approves verification
5. Process continues to document generation

## System Validations

The system performs the following validations throughout the process:

1. **Identity Validation**:

   - Checks for duplicate identity numbers
   - Validates format of identity documents

2. **Address Validation**:

   - Validates address format
   - Checks postal code against geographic database

3. **Biometric Quality Checks**:

   - Fingerprint quality (resolution, clarity)
   - Facial photo requirements (lighting, pose)
   - Document scan quality

4. **Biometric Deduplication**:

   - Compares fingerprints against existing database
   - Performs facial recognition matching
   - Checks iris patterns if available
   - Calculates match confidence scores

5. **Fraud Detection**:

   - Identifies potential duplicate identities
   - Flags suspicious patterns
   - Maintains blocked list of fraudulent identifiers

6. **Document Generation**:

   - Validates all required information is present
   - Ensures proper formatting of official documents
   - Applies security features to prevent forgery

7. **CPF Number Generation**:
   - Guarantees uniqueness
   - Follows Brazilian CPF number algorithm
   - Includes check digits for validation

## Security Measures

The following security measures protect the CPF issuance process:

1. **User Authentication**:

   - Multi-factor authentication for sensitive operations
   - Session management and timeout

2. **Officer Authorization**:

   - Role-based access control
   - Action logging and audit trails

3. **Manager Authorization**:

   - Elevated permissions for deduplication and document generation
   - Approval workflows for fraud reporting
   - Comprehensive audit logging of all actions

4. **Biometric Data Protection**:

   - End-to-end encryption of biometric data
   - Secure transmission to external API
   - Strict access controls for biometric database

5. **Fraud Prevention**:

   - Blocked list enforcement
   - Automated fraud pattern detection
   - Cross-checking of multiple biometric identifiers

6. **Data Protection**:

   - Encryption of biometric data
   - Secure storage of personal information
   - Access control to sensitive records

7. **Document Security**:

   - Digital signatures on generated documents
   - Anti-forgery features in document templates
   - Secure document storage and transmission

8. **Credential Security**:
   - Verification codes for credential validation
   - Revocation mechanism for compromised credentials
   - Audit trail of all credential usage
