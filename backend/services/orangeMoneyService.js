const axios = require('axios');
const crypto = require('crypto');

/**
 * Orange Money Payment Service
 * Production-ready implementation with secure credential management,
 * automatic token refresh, and comprehensive transaction logging
 */
class OrangeMoneyService {
  constructor() {
    // Load credentials from environment variables (never hardcoded)
    this.baseUrl = process.env.ORANGE_MONEY_BASE_URL;
    this.merchantId = process.env.ORANGE_MONEY_MERCHANT_ID;
    this.merchantKey = process.env.ORANGE_MONEY_MERCHANT_KEY;
    this.clientId = process.env.ORANGE_MONEY_CLIENT_ID;
    this.clientSecret = process.env.ORANGE_MONEY_CLIENT_SECRET;
    this.environment = process.env.ORANGE_MONEY_ENVIRONMENT || 'sandbox';
    this.notifyUrl = process.env.ORANGE_MONEY_NOTIFY_URL;
    this.returnUrl = process.env.ORANGE_MONEY_RETURN_URL;
    
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
      'ORANGE_MONEY_BASE_URL',
      'ORANGE_MONEY_MERCHANT_ID',
      'ORANGE_MONEY_MERCHANT_KEY',
      'ORANGE_MONEY_CLIENT_ID',
      'ORANGE_MONEY_CLIENT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required Orange Money credentials: ${missing.join(', ')}. ` +
        'Please configure these in your .env file.'
      );
    }
  }

  /**
   * Generate a unique order ID for transactions
   * @returns {string} Unique order ID
   */
  generateOrderId() {
    return 'OM-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
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
   * Create OAuth2 access token for API authentication
   * Tokens are automatically refreshed when expired
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

      // Create Basic Auth header from Client ID and Client Secret
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        `${this.baseUrl}/oauth/v2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Orange tokens typically expire in 3600 seconds (1 hour)
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn * 1000);

      this.log('Access token generated successfully', 'SUCCESS', {
        expiresIn: `${expiresIn} seconds`,
        expiresAt: new Date(this.tokenExpiry).toISOString()
      });

      return this.accessToken;
    } catch (error) {
      this.log('Failed to generate access token', 'ERROR', {
        error: error.response?.data || error.message
      });
      throw new Error(`Orange Money token generation failed: ${error.message}`);
    }
  }

  /**
   * Initiate a payment transaction
   * @param {Object} params Transaction parameters
   * @param {string} params.amount Transaction amount
   * @param {string} params.currency Currency code (e.g., 'XAF', 'XOF')
   * @param {string} params.phoneNumber Payer's phone number (format: 237XXXXXXXXX)
   * @param {string} params.description Transaction description
   * @param {string} params.reference Merchant reference
   * @returns {Promise<Object>} Transaction result
   */
  async initiatePayment(params) {
    const startTime = Date.now();
    const orderId = this.generateOrderId();

    try {
      // Validate input parameters
      this.validatePaymentParams(params);

      // Ensure we have a valid access token
      const token = await this.createAccessToken();

      this.log('Initiating Orange Money payment', 'INFO', {
        orderId,
        amount: params.amount,
        currency: params.currency,
        phoneNumber: this.maskPhoneNumber(params.phoneNumber)
      });

      // Prepare request payload
      const payload = {
        merchant_key: this.merchantKey,
        currency: params.currency,
        order_id: orderId,
        amount: params.amount.toString(),
        return_url: this.returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        notif_url: this.notifyUrl || '',
        lang: 'en',
        reference: params.reference || orderId,
        customer_msisdn: params.phoneNumber,
        customer_email: params.email || '',
        customer_firstname: params.firstName || 'Customer',
        customer_lastname: params.lastName || '',
        description: params.description || 'CloudLiteracy payment'
      };

      // Execute payment initiation
      const response = await axios.post(
        `${this.baseUrl}/webpayment/v1/pay`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      const duration = Date.now() - startTime;
      const data = response.data;

      this.log('Payment initiated successfully', 'SUCCESS', {
        orderId,
        paymentToken: data.payment_token,
        duration: `${duration}ms`,
        statusCode: response.status
      });

      return {
        success: true,
        orderId,
        paymentToken: data.payment_token,
        paymentUrl: data.payment_url,
        message: 'Payment initiated successfully',
        timestamp: new Date().toISOString(),
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.log('Payment initiation failed', 'ERROR', {
        orderId,
        duration: `${duration}ms`,
        error: error.response?.data || error.message,
        statusCode: error.response?.status
      });

      return {
        success: false,
        orderId,
        message: this.getErrorMessage(error),
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString(),
        duration
      };
    }
  }

  /**
   * Query transaction status
   * @param {string} orderId Order ID or payment token
   * @returns {Promise<Object>} Transaction status details
   */
  async getTransactionStatus(orderId) {
    const startTime = Date.now();

    try {
      // Ensure we have a valid access token
      const token = await this.createAccessToken();

      this.log('Querying transaction status', 'INFO', { orderId });

      const response = await axios.post(
        `${this.baseUrl}/webpayment/v1/transactionstatus`,
        {
          order_id: orderId,
          merchant_key: this.merchantKey
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      const duration = Date.now() - startTime;
      const data = response.data;

      // Map Orange Money status to standard status
      const status = this.mapStatus(data.status);

      // Log based on transaction status
      const logLevel = status === 'SUCCESSFUL' ? 'SUCCESS' : 
                       status === 'FAILED' ? 'ERROR' : 'INFO';

      this.log(`Transaction status: ${status}`, logLevel, {
        orderId,
        status,
        amount: data.amount,
        currency: data.currency,
        duration: `${duration}ms`
      });

      return {
        success: true,
        orderId: data.order_id,
        transactionId: data.txnid,
        reference: data.reference,
        amount: data.amount,
        currency: data.currency,
        payer: {
          phoneNumber: this.maskPhoneNumber(data.customer_msisdn),
          email: data.customer_email
        },
        status,
        rawStatus: data.status,
        paymentMethod: data.payment_method,
        timestamp: new Date().toISOString(),
        duration,
        // Human-readable summary
        summary: this.generateTransactionSummary(data, status)
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      this.log('Transaction status query failed', 'ERROR', {
        orderId,
        duration: `${duration}ms`,
        error: error.response?.data || error.message,
        statusCode: error.response?.status
      });

      return {
        success: false,
        orderId,
        message: this.getErrorMessage(error),
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString(),
        duration
      };
    }
  }

  /**
   * Validate payment parameters
   * @param {Object} params Parameters to validate
   * @throws {Error} if validation fails
   */
  validatePaymentParams(params) {
    if (!params.amount || isNaN(params.amount) || params.amount <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    if (!params.currency || typeof params.currency !== 'string') {
      throw new Error('Invalid currency: must be a valid currency code (e.g., XAF, XOF)');
    }

    if (!params.phoneNumber || !/^\d{10,15}$/.test(params.phoneNumber)) {
      throw new Error('Invalid phone number: must be 10-15 digits (e.g., 237XXXXXXXXX)');
    }
  }

  /**
   * Map Orange Money status to standard status codes
   * @param {string} orangeStatus Orange Money status
   * @returns {string} Standard status
   */
  mapStatus(orangeStatus) {
    const statusMap = {
      'SUCCESS': 'SUCCESSFUL',
      'PENDING': 'PENDING',
      'FAILED': 'FAILED',
      'EXPIRED': 'FAILED',
      'CANCELLED': 'REJECTED',
      'INITIATED': 'PENDING'
    };

    return statusMap[orangeStatus] || 'PENDING';
  }

  /**
   * Generate human-readable transaction summary
   * @param {Object} data Transaction data
   * @param {string} status Mapped status
   * @returns {string} Summary text
   */
  generateTransactionSummary(data, status) {
    const statusEmoji = {
      'SUCCESSFUL': '✅',
      'FAILED': '❌',
      'PENDING': '⏳',
      'REJECTED': '🚫'
    };

    const emoji = statusEmoji[status] || '❓';
    
    return `${emoji} Transaction ${status}: ${data.amount} ${data.currency} ` +
           `from ${this.maskPhoneNumber(data.customer_msisdn)} ` +
           `(Order: ${data.order_id})`;
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
      409: 'Duplicate transaction. Order ID already exists.',
      500: 'Orange Money service error. Please try again later.',
      503: 'Orange Money service temporarily unavailable.'
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
   * @param {string} message Log message
   * @param {string} level Log level (INFO, SUCCESS, ERROR, WARN)
   * @param {Object} data Additional data to log
   */
  log(message, level = 'INFO', data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service: 'ORANGE_MONEY',
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
      `${color}[${timestamp}] [ORANGE_MONEY] [${level}]${colors.RESET} ${message}`
    );

    // Log additional data if present
    if (Object.keys(data).length > 0) {
      console.log(JSON.stringify(data, null, 2));
    }

    // In production, send to logging service
    // Example: logger.log(logEntry);
  }
}

module.exports = new OrangeMoneyService();
