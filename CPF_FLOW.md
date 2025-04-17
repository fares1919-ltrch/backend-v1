# CPF Request Flow Process

This document outlines the complete flow of a CPF (Cadastro de Pessoas Físicas) request from submission to issuance in our system.

## Overview

The CPF issuance process is designed to be secure, efficient, and compliant with regulatory requirements. It involves multiple steps and stakeholders, including users, officers, and system administrators.

## Process Flow Diagram

```
┌───────────────────┐          ┌───────────────────┐          ┌───────────────────┐
│                   │          │                   │          │                   │
│     USER          │          │     OFFICER       │          │     SYSTEM        │
│                   │          │                   │          │                   │
└─────────┬─────────┘          └─────────┬─────────┘          └─────────┬─────────┘
          │                              │                              │
          ▼                              │                              │
┌───────────────────┐                    │                              │
│   Submit CPF      │                    │                              │
│    Request        │                    │                              │
└─────────┬─────────┘                    │                              │
          │                              │                              │
          ▼                              │                              │
┌───────────────────┐                    │                              │
│  Select Service   │                    │                              │
│     Center        │                    │                              │
└─────────┬─────────┘                    │                              │
          │                              │                              │
          │                              │                              │
          │                              │                              │
          │                              │                    ┌───────────────────┐
          │                              │                    │   Validate        │
          │                              │                    │   Request Data    │
          │                              │                    └─────────┬─────────┘
          │                              │                              │
          │                              │                              ▼
          │                              │                    ┌───────────────────┐
          │                              │                    │  Set Request      │
          │                              │                    │  Status: PENDING  │
          │                              │                    └─────────┬─────────┘
          │                              │                              │
          │                              ▼                              │
          │                    ┌───────────────────┐                    │
          │                    │  Review Request   │                    │
          │                    │                   │                    │
          │                    └─────────┬─────────┘                    │
          │                              │                              │
          │                              ▼                              │
          │                    ┌───────────────────┐                    │
          │                    │ Make Decision     │                    │
          │                    │ (Approve/Reject)  │                    │
          │                    └─────────┬─────────┘                    │
          │                              │                              │
          │                              │                              ▼
          │                              │                    ┌───────────────────┐
          │                              │                    │ Update Request    │
          │                              │                    │ Status            │
          │                              │                    └─────────┬─────────┘
          ▼                              │                              │
┌───────────────────┐                    │                              │
│ Receive           │                    │                              │
│ Notification      │◄───────────────────┼──────────────────────────────┘
└─────────┬─────────┘                    │
          │                              │
          ▼                              │
┌───────────────────┐                    │
│ Book Appointment  │                    │
│ (if approved)     │                    │
└─────────┬─────────┘                    │
          │                              │
          ▼                              │
┌───────────────────┐                    │
│ Visit Center for  │                    │
│ Appointment       │                    │
└─────────┬─────────┘                    │
          │                              │
          │                              ▼
          │                    ┌───────────────────┐
          │                    │ Verify Identity   │
          │                    │                   │
          │                    └─────────┬─────────┘
          │                              │
          │                              ▼
          │                    ┌───────────────────┐
          │                    │ Collect Biometric │
          │                    │ Data              │
          │                    └─────────┬─────────┘
          │                              │
          │                              ▼
          │                    ┌───────────────────┐
          │                    │ Verify Biometric  │
          │                    │ Data Quality      │
          │                    └─────────┬─────────┘
          │                              │
          │                              │
          │                              │                    ┌───────────────────┐
          │                              │                    │ Generate CPF      │
          │                              └────────────────────►                   │
          │                                                   └─────────┬─────────┘
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

### 5. CPF Issuance

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
4. **Completed**: CPF has been issued successfully

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

4. **CPF Number Generation**:
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

3. **Data Protection**:
   - Encryption of biometric data
   - Secure storage of personal information
   - Access control to sensitive records

4. **Credential Security**:
   - Verification codes for credential validation
   - Revocation mechanism for compromised credentials 