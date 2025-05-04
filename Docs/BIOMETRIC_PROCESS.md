# Biometric Data Collection Process

This document details the biometric data collection process implemented in the CPF System, including data types, quality standards, and security considerations.

## Overview

Biometric data collection is a critical component of the CPF issuance process, ensuring the uniqueness and security of each CPF credential. The system collects multiple biometric identifiers to establish a comprehensive digital identity for each citizen.

## Types of Biometric Data

### 1. Fingerprints

The system collects fingerprint data from all ten fingers:

- **Right Hand**: Thumb, Index, Middle, Ring, and Little fingers
- **Left Hand**: Thumb, Index, Middle, Ring, and Little fingers

**Technical Specifications:**

- **Resolution**: Minimum 500 DPI
- **Format**: WSQ (Wavelet Scalar Quantization) or JPEG2000
- **Quality Threshold**: NFIQ 2.0 score of 60 or higher
- **Capture Device**: FBI-certified fingerprint scanner

### 2. Facial Biometrics

A high-quality facial photograph is captured following international standards:

**Technical Specifications:**

- **Resolution**: Minimum 600x800 pixels
- **Format**: JPEG or PNG
- **Background**: Uniform, light-colored
- **Expression**: Neutral expression, both eyes open
- **Lighting**: Even lighting without shadows
- **Attributes Validation**:
  - No head coverings (except for religious purposes)
  - No glasses (if possible)
  - Face centered in frame

### 3. Iris Scan (Optional)

For enhanced security, iris scans may be collected:

**Technical Specifications:**

- **Format**: ISO/IEC 19794-6 compliant
- **Resolution**: Minimum 640x480 pixels
- **Capture**: Both left and right iris
- **Quality**: Sufficient contrast between iris and pupil

### 4. Signature

Digital signature capture:

**Technical Specifications:**

- **Resolution**: Minimum 300 DPI
- **Format**: Vector or high-quality raster
- **Capture**: On digital signing pad

## Collection and Verification Process

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Identity         │────►│  Fingerprint      │────►│  Facial           │
│  Verification     │     │  Collection       │     │  Photograph       │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └─────────┬─────────┘
                                                              │
                                                              │
                                                              ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Data Quality     │◄────┤  Signature        │◄────┤  Iris Scan        │
│  Verification     │     │  Capture          │     │  (if applicable)  │
│                   │     │                   │     │                   │
└─────────┬─────────┘     └───────────────────┘     └───────────────────┘
          │
          │
          ▼
┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │
│  Secure           │────►│  Biometric        │
│  Storage          │     │  Registration     │
│                   │     │                   │
└─────────┬─────────┘     └───────────────────┘
          │
          │
          ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Manager          │────►│  Deduplication    │────►│  Results          │
│  Review           │     │  Process          │     │  Analysis         │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └─────────┬─────────┘
                                                              │
                                                              │
                                                              ▼
┌───────────────────┐                                ┌───────────────────┐
│                   │                                │                   │
│  Fraud            │◄───────────────────────────────┤  Decision         │
│  Reporting        │                                │  (Unique/Fraud)   │
│                   │                                │                   │
└───────────────────┘                                └─────────┬─────────┘
                                                              │
                                                              │
                                                              ▼
                                                   ┌───────────────────┐
                                                   │                   │
                                                   │  Document         │
                                                   │  Generation       │
                                                   │                   │
                                                   └───────────────────┘
```

### Step 1: Preparation

1. **Officer Login**: Officer logs into the biometric collection module with secure credentials
2. **Identity Verification**: Officer verifies the citizen's identity using government-issued ID
3. **System Setup**: Verification of all biometric capture devices

### Step 2: Data Collection

1. **Fingerprint Capture**:

   - Each finger is captured individually
   - Quality check performed in real-time
   - Recapture if quality threshold not met

2. **Facial Photograph**:

   - Proper positioning and lighting check
   - Multiple captures to select best quality
   - Automatic compliance check with standards

3. **Iris Scan** (if applicable):

   - Capture of both irises
   - Quality verification

4. **Signature Capture**:
   - Digital signature on electronic pad
   - Multiple attempts allowed if needed

### Step 3: Quality Verification

Each biometric sample undergoes real-time quality assessment:

1. **Fingerprint Quality Check**:

   - NFIQ (NIST Fingerprint Image Quality) scoring
   - Ridge clarity and minutiae count verification
   - Sufficient area coverage

2. **Facial Image Quality Check**:

   - Face detection and positioning
   - Lighting and contrast verification
   - Expression and eye openness check

3. **Iris Quality Check**:
   - Clarity and focus verification
   - Sufficient iris area visible
   - Minimal occlusion by eyelids

### Step 4: Data Storage and Association

1. **Encryption**: All biometric data is encrypted immediately upon capture
2. **Association**: Data is associated with the user's CPF request
3. **Metadata Recording**: Collection environment and device information recorded
4. **Verification Status**: Initial verification status set to "pending"

### Step 5: Manager Review

1. **Notification**: Manager receives notification of new biometric data
2. **Data Access**: Manager accesses the collected biometric data
3. **Quality Review**: Manager verifies the quality of collected data
4. **Approval for Deduplication**: Manager approves data for deduplication process

### Step 6: Deduplication Process

1. **API Integration**: System connects to external deduplication API
2. **Data Transmission**: Encrypted biometric data is sent to the API
3. **Processing**: External API performs deduplication against database
4. **Results Reception**: System receives deduplication results
5. **Results Storage**: Results are securely stored and associated with the request

### Step 7: Results Analysis

1. **Match Scoring**: System processes match confidence scores
2. **Threshold Application**: Scores are compared against predefined thresholds
3. **Flagging**: Potential matches are flagged for manager review
4. **Visualization**: Results are presented in user-friendly interface

### Step 8: Decision Making

1. **Manager Review**: Manager reviews deduplication results
2. **Match Verification**: For potential matches, detailed comparison is performed
3. **Decision**: Manager decides if case is unique or potential fraud
4. **Documentation**: Decision is documented with justification

### Step 9: Document Generation (if unique)

1. **Template Selection**: Appropriate document template is selected
2. **Data Population**: Template is populated with user information
3. **Security Features**: Security elements are applied to document
4. **Digital Signing**: Document is digitally signed
5. **Storage**: Generated document is securely stored

### Step 10: Fraud Reporting (if fraud detected)

1. **Report Creation**: Detailed fraud report is created
2. **Evidence Attachment**: Matching records are attached as evidence
3. **Blocking Criteria**: Manager selects criteria for blocking (email, identity number, face)
4. **Notification**: Officer is notified about fraud detection
5. **Status Update**: CPF request status is updated to "fraud"

## Quality Standards

### Fingerprint Quality

| Quality Level | NFIQ 2.0 Score | Action                             |
| ------------- | -------------- | ---------------------------------- |
| Excellent     | 80-100         | Proceed                            |
| Good          | 60-79          | Proceed                            |
| Fair          | 40-59          | Recapture recommended              |
| Poor          | 20-39          | Recapture required                 |
| Very Poor     | 0-19           | Multiple recaptures and escalation |

### Facial Image Quality

| Criteria      | Requirement           | Validation Method               |
| ------------- | --------------------- | ------------------------------- |
| Resolution    | Min 600x800 pixels    | Automated pixel count           |
| Face Coverage | 70-80% of frame       | Automated face detection        |
| Expression    | Neutral               | AI-based expression analysis    |
| Eyes          | Both visible and open | Eye detection algorithm         |
| Lighting      | Even illumination     | Histogram analysis              |
| Background    | Uniform, no shadows   | Background uniformity detection |
| Head Position | Straight, no tilt     | Face orientation detection      |

## Supporting Documents

In addition to biometric data, the following supporting documents may be digitized:

1. **Identity Card**: High-resolution scan of official ID
2. **Proof of Address**: Utility bill or official correspondence
3. **Birth Certificate**: For first-time CPF applicants
4. **Foreign Documentation**: For non-citizens (if applicable)

## Deduplication and Verification Process

After collection, biometric data undergoes a comprehensive verification process:

### Initial Verification

1. **Quality Assurance**: Secondary quality review by automated system
2. **Preliminary Check**: Basic validation of biometric data integrity

### Deduplication Process

1. **External API Integration**: Connection to specialized biometric matching service
2. **Multi-modal Matching**: Comparison using multiple biometric identifiers:
   - Fingerprint matching using minutiae points
   - Facial recognition using deep learning algorithms
   - Iris pattern matching (if available)
3. **Confidence Scoring**: Each match generates a confidence score
4. **Threshold Application**: Predefined thresholds determine potential matches

### Match Analysis

1. **Result Categorization**:
   - No Match: No similar records found
   - Potential Match: Records with scores above threshold but below confirmation level
   - Confirmed Match: Records with high confidence scores
2. **Visual Verification**: Side-by-side comparison of potential matches
3. **Decision Support**: System provides recommendations based on match scores

### Fraud Detection

1. **Pattern Recognition**: Identification of suspicious patterns across applications
2. **Historical Analysis**: Comparison with previously identified fraud cases
3. **Cross-reference**: Checking against blocked list of identifiers
4. **Risk Scoring**: Assignment of fraud risk score based on multiple factors

### Final Verification

1. **Manager Review**: Final decision by authorized manager
2. **Documentation**: Detailed recording of verification decision
3. **Status Update**: Update of CPF request status based on verification outcome

## Security Measures

### Data Protection

1. **Encryption**: AES-256 encryption for all stored biometric data
2. **Access Control**: Role-based access with strict permissions
3. **Segmentation**: Separation of biometric data from personal identifiers
4. **Data Minimization**: Only necessary data is collected and stored
5. **Secure Transmission**: End-to-end encryption for data sent to external API
6. **API Authentication**: Secure authentication for external API access
7. **Audit Logging**: Comprehensive logging of all data access and transmission

### Compliance

The biometric collection system complies with:

1. **LGPD**: Brazilian General Data Protection Law requirements
2. **ISO/IEC 19794-x**: International biometric data interchange formats
3. **ICAO 9303**: International standards for travel documents

### Audit and Monitoring

1. **Collection Logs**: Detailed logs of all biometric collection activities
2. **Access Logs**: Records of all access to biometric data
3. **Quality Metrics**: Ongoing monitoring of collection quality
4. **Deduplication Logs**: Records of all deduplication requests and results
5. **Fraud Reports**: Documentation of all fraud cases and actions taken
6. **Blocking History**: Comprehensive record of all blocked identifiers
7. **API Communication**: Logs of all interactions with external API

## Special Considerations

### Accessibility

1. **Physical Disabilities**: Alternative procedures for individuals unable to provide certain biometrics
2. **Temporary Conditions**: Provisions for temporary issues (e.g., bandaged fingers)
3. **Age Considerations**: Adapted procedures for elderly or very young citizens

### Privacy Protections

1. **Consent**: Clear explanation and consent process before biometric collection
2. **Purpose Limitation**: Data used only for CPF issuance and validation
3. **Retention Policy**: Clear policies on data retention and deletion
4. **Subject Rights**: Mechanisms for citizens to access information about their data

## Technical Implementation

The biometric data collection and verification module integrates with the following system components:

1. **Device Integration**: API for biometric capture devices
2. **Quality Assessment**: Real-time quality evaluation algorithms
3. **Storage**: Secure database with encryption and access controls
4. **Verification**: Matching algorithms for deduplication and verification
5. **External API Integration**: Secure connection to specialized deduplication service
6. **Document Generation**: Templates and tools for official document creation
7. **Fraud Management**: System for tracking and managing fraud cases
8. **Blocking System**: Mechanism to prevent fraudulent users from accessing the system
9. **Notification Service**: Alerts for various stakeholders about process status

## Deduplication API Integration

The system integrates with an external deduplication API with the following features:

1. **Authentication**: Secure API key and token-based authentication
2. **Data Format**: Standardized format for biometric data transmission
3. **Endpoints**:
   - `/api/deduplication/fingerprint`: Fingerprint matching
   - `/api/deduplication/face`: Facial recognition matching
   - `/api/deduplication/iris`: Iris pattern matching
   - `/api/deduplication/multimodal`: Combined biometric matching
4. **Response Format**: Standardized format for match results
5. **Error Handling**: Robust error handling and retry mechanisms
6. **Performance**: Optimized for quick response times

## Document Generation System

The document generation system includes:

1. **Template Management**: Library of official document templates
2. **Data Mapping**: Automatic population of templates with user data
3. **Security Features**: Integration of anti-forgery elements
4. **Digital Signatures**: Application of cryptographic signatures
5. **Version Control**: Management of document versions and revisions
6. **Distribution**: Secure delivery of documents to users
