const axios = require('axios');
const crypto = require('crypto');

/**
 * MTN Mobile Money Collection Service
 * Production-ready implementation with secure credential management,
 * automatic token refresh, and comprehensive transaction logging
 */
class MTNMoMoService {
  constructor() {
    // Load credentials from environment variables (never hardcoded)
    this.baseUrl = process.env.MTN_MOMO_BASE_URL;
    this.subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
    this.apiUser = process.env.MTN_MOMO_API_USER;
    this.apiKey = process.env.MTN_MOMO_API_KEY;
    this.environment = process.env.MTN_MOMO_ENVIRONMENT || 'sandbox'; // sandbox or production
    this.callbackUrl = process.env.MTN_MOMO_CALLBACK_URL;
    
    // Token management
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // Validate required credentials
    this.validateCredentials();
  }

  /**
   * Validate that all required credentials are present
   * @throws {Error} if any required credential is missing
   */
  validateCredentials() {
    const required = [
      'MTN_MOMO_BASE_URL',
      'MTN_MOMO_SUBSCRIPTION_KEY',
      'MTN_MOMO_API_USER',
      'MTN_MOMO_API_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required MTN MoMo credentials: ${missing.join(', ')}. ` +
        'Please configure these in your .env file.'
      );
    }
  }

  /**
   * Generate a unique reference ID for transactions
   * @returns {string} UUID v4 format
   */
  generateReferenceId() {
    return crypto.randomUUID();
  }

  /**
   * Check if current access token is valid
   * @returns {boolean}
   */
  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }
    // Add 60 second buffer before expiry
    return Date.now() < (this.tokenExpiry - 60000);
  }

  /**
   * Create access token for API authentication
   * Tokens are valid for 1 hour and automatically refreshed
   * @returns {Promise<string>} Access token
   */
  async createAccessToken() {
    try {
      // Check if current token is still valid
      if (this.isTokenValid()) {
        this.log('Using cached access token', 'INFO');
        return this.accessToken;
      }

      this.log('Generating new access token', 'INFO');

      // Create Basic Auth header from API User and API Key
      const auth = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');

      const response = await axios.post(
        `${this.baseUrl}/collection/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );

      this.accessToken = response.data.access_token;
      // MTN tokens expire in 3600 seconds (1 hour)
      this.tokenExpiry = Date.now() + (3600 * 1000);

      this.log('Access token generated successfully', 'SUCCESS', {
        expiresIn: '3600 seconds',
        expiresAt: new Date(this.tokenExpiry).toISOString()
      });

      return this.accessToken;
    } catch (error) {
      this.log('Failed to generate access token', 'ERROR', {
        error: error.response?.data || error.message
      });
      throw new Error(`MTN MoMo token generation failed: ${error.message}`);
    }
  }

  /**
   * Initiate a request-to-pay transaction
   * @param {Object} params Transaction parameters
   * @param {string} params.amount Transaction amount
   * @param {string} params.currency Currency code (e.g., 'EUR', 'XAF')
   * @param {string} params.phoneNumber Payer's phone number (format: 237XXXXXXXXX)
   * @param {string} params.payerMessage Message to payer
   * @param {string} params.payeeNote Note for payee (merchant)
   * @returns {Promise<Object>} Transaction result
   */
  async requestToPay(params) {
    const startTime = Date.now();
    const referenceId = this.generateReferenceId();

    try {
      // Validate input parameters
      this.validateRequestToPayParams(params);

      // Ensure we have a valid access token
      const token = await this.createAccessToken();

      this.log('Initiating request-to-pay transaction', 'INFO', {
        referenceId,
        amount: params.amount,
        currency: params.currency,
        phoneNumber: this.maskPhoneNumber(params.phoneNumber)
      });

      // Prepare request payload
      const payload = {
        amount: params.amount.toString(),
        currency: params.currency,
        externalId: params.externalId || referenceId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: params.phoneNumber
        },
        payerMessage: params.payerMessage || 'Payment for CloudLiteracy',
        payeeNote: params.payeeNote || 'CloudLiteracy module purchase'
      };

      // Execute request-to-pay
      const response = await axios.post(
        `${this.baseUrl}/collection/v1_0/requesttopay`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json',
            'X-Callback-Url': this.callbackUrl || ''
          }
        }
      );

      const duration = Date.now() - startTime;

      this.log('Request-to-pay initiated successfully', 'SUCCESS', {
        referenceId,
        duration: `${duration}ms`,
        statusCode: response.status
      });

      return {
        success: true,
        referenceId,
        message: 'Transaction initiated successfully',
        timestamp: new Date().toISOString(),
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.log('Request-to-pay failed', 'ERROR', {
        referenceId,
        duration: `${duration}ms`,
        error: error.response?.data || error.message,
        statusCode: error.response?.status
      });

      return {
        success: false,
        referenceId,
        message: this.getErrorMessage(error),
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString(),
        duration
      };
    }
  }

  /**
   * Query transaction status
   * @param {string} referenceId Transaction reference ID
   * @returns {Promise<Object>} Transaction status details
   */
  async getTransactionStatus(referenceId) {
    const startTime = Date.now();

    try {
      // Ensure we have a valid access token
      const token = await this.createAccessToken();

      this.log('Querying transaction status', 'INFO', { referenceId });

      const response = await axios.get(
        `${this.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );

      const duration = Date.now() - startTime;
      const data = response.data;

      // Log based on transaction status
      const logLevel = data.status === 'SUCCESSFUL' ? 'SUCCESS' : 
                       data.status === 'FAILED' ? 'ERROR' : 'INFO';

      this.log(`Transaction status: ${data.status}`, logLevel, {
        referenceId,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        duration: `${duration}ms`
      });

      return {
        success: true,
        referenceId,
        transactionId: data.financialTransactionId,
        externalId: data.externalId,
        amount: data.amount,
        currency: data.currency,
        payer: {
          partyIdType: data.payer?.partyIdType,
          partyId: this.maskPhoneNumber(data.payer?.partyId)
        },
        status: data.status,
        reason: data.reason || null,
        payerMessage: data.payerMessage,
        payeeNote: data.payeeNote,
        timestamp: new Date().toISOString(),
        duration,
        // Human-readable summary
        summary: this.generateTransactionSummary(data)
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      this.log('Transaction status query failed', 'ERROR', {
        referenceId,
        duration: `${duration}ms`,
        error: error.response?.data || error.message,
        statusCode: error.response?.status
      });

      return {
        success: false,
        referenceId,
        message: this.getErrorMessage(error),
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString(),
        duration
      };
    }
  }

  /**
   * Get account balance
   * @returns {Promise<Object>} Account balance details
   */
  async getAccountBalance() {
    try {
      const token = await this.createAccessToken();

      this.log('Fetching account balance', 'INFO');

      const response = await axios.get(
        `${this.baseUrl}/collection/v1_0/account/balance`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );

      this.log('Account balance retrieved', 'SUCCESS', {
        availableBalance: response.data.availableBalance,
        currency: response.data.currency
      });

      return {
        success: true,
        availableBalance: response.data.availableBalance,
        currency: response.data.currency,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log('Failed to fetch account balance', 'ERROR', {
        error: error.response?.data || error.message
      });

      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate request-to-pay parameters
   * @param {Object} params Parameters to validate
   * @throws {Error} if validation fails
   */
  validateRequestToPayParams(params) {
    if (!params.amount || isNaN(params.amount) || params.amount <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    if (!params.currency || typeof params.currency !== 'string') {
      throw new Error('Invalid currency: must be a valid currency code (e.g., EUR, XAF)');
    }

    if (!params.phoneNumber || !/^\d{10,15}$/.test(params.phoneNumber)) {
      throw new Error('Invalid phone number: must be 10-15 digits (e.g., 237XXXXXXXXX)');
    }
  }

  /**
   * Generate human-readable transaction summary
   * @param {Object} data Transaction data
   * @returns {string} Summary text
   */
  generateTransactionSummary(data) {
    const statusEmoji = {
      'SUCCESSFUL': '✅',
      'FAILED': '❌',
      'PENDING': '⏳',
      'REJECTED': '🚫'
    };

    const emoji = statusEmoji[data.status] || '❓';
    
    return `${emoji} Transaction ${data.status}: ${data.amount} ${data.currency} ` +
           `from ${this.maskPhoneNumber(data.payer?.partyId)} ` +
           `(Ref: ${data.externalId})`;
  }

  /**
   * Get user-friendly error message
   * @param {Error} error Error object
   * @returns {string} Error message
   */
  getErrorMessage(error) {
    const statusCode = error.response?.status;
    const errorData = error.response?.data;

    const errorMessages = {
      400: 'Invalid request parameters. Please check transaction details.',
      401: 'Authentication failed. Please verify API credentials.',
      403: 'Access forbidden. Insufficient permissions.',
      404: 'Transaction not found.',
      409: 'Duplicate transaction. Reference ID already exists.',
      500: 'MTN MoMo service error. Please try again later.',
      503: 'MTN MoMo service temporarily unavailable.'
    };

    if (errorMessages[statusCode]) {
      return errorMessages[statusCode];
    }

    if (errorData?.message) {
      return errorData.message;
    }

    return 'Transaction failed. Please contact support.';
  }

  /**
   * Mask phone number for security (show only last 4 digits)
   * @param {string} phoneNumber Phone number to mask
   * @returns {string} Masked phone number
   */
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 4) {
      return '****';
    }
    return '*'.repeat(phoneNumber.length - 4) + phoneNumber.slice(-4);
  }

  /**
   * Comprehensive logging with timestamps and structured data
   * Logs are written to console with proper formatting
   * In production, integrate with logging service (Winston, Bunyan, etc.)
   * @param {string} message Log message
   * @param {string} level Log level (INFO, SUCCESS, ERROR, WARN)
   * @param {Object} data Additional data to log
   */
  log(message, level = 'INFO', data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service: 'MTN_MOMO',
      level,
      message,
      environment: this.environment,
      ...data
    };

    // Color codes for console output
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      SUCCESS: '\x1b[32m', // Green
      ERROR: '\x1b[31m',   // Red
      WARN: '\x1b[33m',    // Yellow
      RESET: '\x1b[0m'
    };

    const color = colors[level] || colors.INFO;
    
    // Console output with color
    console.log(
      `${color}[${timestamp}] [MTN_MOMO] [${level}]${colors.RESET} ${message}`
    );

    // Log additional data if present
    if (Object.keys(data).length > 0) {
      console.log(JSON.stringify(data, null, 2));
    }

    // In production, send to logging service
    // Example: logger.log(logEntry);
  }
}

module.exports = new MTNMoMoService();
