const crypto = require('crypto');
const sharp = require('sharp');
const config = require('../config/biometric.config');
const fs = require('fs').promises;
const path = require('path');

class BiometricProcessor {
  /**
   * Process and validate fingerprint data
   * @param {Buffer} imageData - Raw fingerprint image data
   * @param {String} format - Image format (WSQ, JPEG2000, PNG)
   * @returns {Object} Processed fingerprint data with quality metrics
   */
  static async processFingerprintImage(imageData, format) {
    try {
      const image = sharp(imageData);
      const metadata = await image.metadata();

      // Validate image dimensions and DPI
      if (metadata.width < config.quality.fingerprint.minWidth ||
          metadata.height < config.quality.fingerprint.minHeight) {
        throw new Error('Fingerprint image dimensions too small');
      }

      // Calculate image quality score (simplified simulation)
      const qualityScore = await this.calculateImageQuality(imageData);

      // Convert to standard format if needed
      let processedImage = imageData;
      if (format !== 'WSQ') {
        // In a real system, you would use a WSQ encoder library here
        processedImage = await image
          .greyscale()
          .normalize()
          .toBuffer();
      }

      return {
        data: processedImage.toString('base64'),
        quality: qualityScore,
        dpi: metadata.density || 500,
        format: format,
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      throw new Error(`Fingerprint processing failed: ${error.message}`);
    }
  }

  /**
   * Process and validate facial image
   * @param {Buffer} imageData - Raw facial image data
   * @returns {Object} Processed facial image data with attributes
   */
  static async processFacialImage(imageData) {
    try {
      const image = sharp(imageData);
      const metadata = await image.metadata();

      // Validate image dimensions
      if (metadata.width < config.quality.face.minWidth ||
          metadata.height < config.quality.face.minHeight) {
        throw new Error('Facial image dimensions too small');
      }

      // Process image according to standards
      const processedImage = await image
        .resize(config.quality.face.minWidth, config.quality.face.minHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255 }
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Simulate face detection and quality assessment
      const qualityAssessment = await this.assessFacialImageQuality(processedImage);

      return {
        data: processedImage.toString('base64'),
        format: 'JPEG',
        quality: qualityAssessment.quality,
        attributes: {
          width: metadata.width,
          height: metadata.height,
          hasNeutralExpression: qualityAssessment.hasNeutralExpression,
          hasUniformBackground: qualityAssessment.hasUniformBackground,
          hasProperLighting: qualityAssessment.hasProperLighting
        }
      };
    } catch (error) {
      throw new Error(`Facial image processing failed: ${error.message}`);
    }
  }

  /**
   * Process and validate iris scan data
   * @param {Buffer} imageData - Raw iris scan data
   * @returns {Object} Processed iris scan data with quality metrics
   */
  static async processIrisImage(imageData) {
    try {
      const image = sharp(imageData);
      const metadata = await image.metadata();

      // Process iris image (simplified simulation)
      const processedImage = await image
        .greyscale()
        .normalize()
        .toBuffer();

      // Simulate iris quality assessment
      const quality = await this.calculateImageQuality(processedImage);

      return {
        data: processedImage.toString('base64'),
        format: 'ISO-19794-6',
        quality: quality
      };
    } catch (error) {
      throw new Error(`Iris scan processing failed: ${error.message}`);
    }
  }

  /**
   * Process and validate supporting document
   * @param {Buffer} documentData - Raw document image/scan data
   * @param {String} format - Document format (PDF, JPEG, PNG)
   * @returns {Object} Processed document data
   */
  static async processSupportingDocument(documentData, format) {
    try {
      if (format === 'PDF') {
        // Validate PDF (simplified)
        if (documentData.length > config.quality.document.maxSizeBytes) {
          throw new Error('Document size exceeds limit');
        }
        return {
          data: documentData.toString('base64'),
          format: format
        };
      }

      // Process image documents
      const image = sharp(documentData);
      const processedDoc = await image
        .resize(2000, 2000, { fit: 'inside' })
        .jpeg({ quality: 85 })
        .toBuffer();

      return {
        data: processedDoc.toString('base64'),
        format: 'JPEG'
      };
    } catch (error) {
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  /**
   * Calculate image quality score (simplified simulation)
   * @param {Buffer} imageData - Image data to assess
   * @returns {Number} Quality score between 0-100
   */
  static async calculateImageQuality(imageData) {
    try {
      const image = sharp(imageData);
      const stats = await image.stats();
      
      // Simplified quality assessment based on image statistics
      const contrast = stats.channels[0].stdev;
      const brightness = stats.channels[0].mean;
      
      // Calculate quality score (simplified)
      let quality = Math.min(100, Math.max(0,
        (contrast / 128) * 50 + // Contrast contribution
        (Math.abs(brightness - 128) / 128) * 50 // Brightness contribution
      ));

      return Math.round(quality);
    } catch (error) {
      throw new Error(`Quality assessment failed: ${error.message}`);
    }
  }

  /**
   * Assess facial image quality attributes
   * @param {Buffer} imageData - Facial image data
   * @returns {Object} Quality assessment results
   */
  static async assessFacialImageQuality(imageData) {
    try {
      const image = sharp(imageData);
      const stats = await image.stats();

      // Simulate face quality assessment (in a real system, use face detection API)
      const brightness = stats.channels[0].mean;
      const contrast = stats.channels[0].stdev;
      
      return {
        quality: Math.min(100, Math.max(0, (brightness / 255) * 100)),
        hasNeutralExpression: true, // Simulated
        hasUniformBackground: contrast < 30,
        hasProperLighting: brightness > 100 && brightness < 200
      };
    } catch (error) {
      throw new Error(`Facial quality assessment failed: ${error.message}`);
    }
  }

  /**
   * Generate secure storage path for biometric data
   * @param {String} userId - User ID
   * @param {String} type - Type of biometric data
   * @returns {String} Secure storage path
   */
  static generateStoragePath(userId, type) {
    const hash = crypto.createHash('sha256')
      .update(userId + Date.now().toString())
      .digest('hex');
    
    return path.join(config.storagePaths[type], hash.substring(0, 2), hash);
  }
}

module.exports = BiometricProcessor;
