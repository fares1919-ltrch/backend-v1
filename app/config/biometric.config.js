module.exports = {
  // Image quality thresholds
  quality: {
    fingerprint: {
      minDPI: 500,
      maxDPI: 1000,
      minWidth: 500,
      minHeight: 500,
      maxSizeBytes: 2 * 1024 * 1024, // 2MB
      allowedFormats: ['image/jpeg', 'image/png', 'image/wsq']
    },
    face: {
      minWidth: 600,
      minHeight: 800,
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
      allowedFormats: ['image/jpeg', 'image/png']
    },
    iris: {
      minWidth: 640,
      minHeight: 480,
      maxSizeBytes: 3 * 1024 * 1024, // 3MB
      allowedFormats: ['image/jpeg', 'image/png']
    }
  },

  // Storage paths for different types of biometric data
  storagePaths: {
    fingerprints: 'uploads/biometrics/fingerprints',
    faces: 'uploads/biometrics/faces',
    iris: 'uploads/biometrics/iris',
    documents: 'uploads/biometrics/documents'
  },

  // Validation rules
  validation: {
    requiredBiometrics: ['fingerprints', 'face'],
    optionalBiometrics: ['iris'],
    minFingerprintCount: 2, // Minimum number of fingerprints required
    maxRetries: 3 // Maximum attempts for capturing each biometric
  },

  // Security settings
  security: {
    encryptionAlgorithm: 'aes-256-gcm',
    saltRounds: 10,
    tokenExpiryHours: 24
  },

  // Processing settings
  processing: {
    imageCompression: true,
    compressionQuality: 0.8,
    autoRotate: true,
    enhanceContrast: true
  }
};
