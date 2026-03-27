# Mobile Money Integration Guide
## MTN Mobile Money & Orange Money - Production Implementation

This document provides comprehensive guidance for integrating MTN Mobile Money and Orange Money payment gateways into CloudLiteracy platform.

---

## 🏗️ Architecture Overview

### Security Features
- ✅ **Environment Variables Only**: All credentials stored in `.env` file, never hardcoded
- ✅ **Automatic Token Refresh**: Access tokens automatically regenerated before expiry
- ✅ **Secure Logging**: Phone numbers masked, sensitive data never logged
- ✅ **Transaction Audit Trail**: Complete logging with timestamps for reconciliation
- ✅ **Error Handling**: Clear, actionable error messages for operators

### Transaction Flow
```
1. User initiates payment → Frontend sends request
2. Backend validates parameters → Generates unique reference ID
3. Token validation → Auto-refresh if expired
4. Request-to-pay API call → MTN/Orange processes
5. User approves on phone → Payment gateway confirms
6. Status polling → Backend checks transaction status
7. Module unlocked → User gains access
```

---

## 📋 Prerequisites

### For MTN Mobile Money
1. **Business Registration** in Cameroon
2. **MTN MoMo Developer Account**: https://momodeveloper.mtn.com
3. **Collection Product Subscription**
4. **API User & API Key** (provided by MTN)
5. **Subscription Key** (from MTN Developer Portal)

### For Orange Money
1. **Business Registration** in Cameroon
2. **Orange Merchant Account** (contact Orange Cameroon)
3. **OAuth2 Credentials** (Client ID & Secret)
4. **Merchant ID & Merchant Key**
5. **API Access Approval** (can take 2-4 weeks)

---

## 🚀 Setup Instructions

### Step 1: MTN Mobile Money Setup

#### 1.1 Register on MTN Developer Portal
```bash
# Visit: https://momodeveloper.mtn.com
# Create account and verify email
```

#### 1.2 Subscribe to Collection Product
```bash
# In Developer Portal:
# 1. Go to "Products" → "Collection"
# 2. Click "Subscribe"
# 3. Select environment (Sandbox for testing)
# 4. Copy your Subscription Key
```

#### 1.3 Create API User (Sandbox)
```bash
# Use MTN's API or Postman to create API User
POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser
Headers:
  X-Reference-Id: <generate-uuid-v4>
  Ocp-Apim-Subscription-Key: <your-subscription-key>
Body:
{
  "providerCallbackHost": "yourdomain.com"
}

# Save the X-Reference-Id as your API_USER
```

#### 1.4 Create API Key
```bash
POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/{apiuser}/apikey
Headers:
  Ocp-Apim-Subscription-Key: <your-subscription-key>

# Response contains your API Key
```

#### 1.5 Configure Environment Variables
```env
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MTN_MOMO_SUBSCRIPTION_KEY=your_subscription_key_here
MTN_MOMO_API_USER=your_api_user_uuid_here
MTN_MOMO_API_KEY=your_api_key_here
MTN_MOMO_ENVIRONMENT=sandbox
MTN_MOMO_CURRENCY=EUR
MTN_MOMO_CALLBACK_URL=https://yourdomain.com/api/payments/mtn-callback
```

#### 1.6 Production Migration
```env
# After MTN approves your production access:
MTN_MOMO_BASE_URL=https://proxy.momoapi.mtn.com
MTN_MOMO_ENVIRONMENT=production
MTN_MOMO_CURRENCY=XAF
# Update API User and API Key with production credentials
```

---

### Step 2: Orange Money Setup

#### 2.1 Contact Orange Cameroon
```
Email: business@orange.cm
Subject: API Merchant Account Request
Include:
- Business registration documents
- Tax identification number
- Business bank account details
- Expected transaction volume
```

#### 2.2 Receive Credentials
After approval (2-4 weeks), Orange will provide:
- Merchant ID
- Merchant Key
- OAuth2 Client ID
- OAuth2 Client Secret
- API documentation

#### 2.3 Configure Environment Variables
```env
ORANGE_MONEY_BASE_URL=https://api.orange.com/orange-money-webpay/dev
ORANGE_MONEY_MERCHANT_ID=your_merchant_id
ORANGE_MONEY_MERCHANT_KEY=your_merchant_key
ORANGE_MONEY_CLIENT_ID=your_client_id
ORANGE_MONEY_CLIENT_SECRET=your_client_secret
ORANGE_MONEY_ENVIRONMENT=sandbox
ORANGE_MONEY_CURRENCY=XAF
ORANGE_MONEY_NOTIFY_URL=https://yourdomain.com/api/payments/orange-callback
ORANGE_MONEY_RETURN_URL=https://yourdomain.com/payment/success
```

#### 2.4 Production Migration
```env
# After testing in sandbox:
ORANGE_MONEY_BASE_URL=https://api.orange.com/orange-money-webpay/cm
ORANGE_MONEY_ENVIRONMENT=production
```

---

## 💻 API Usage

### MTN Mobile Money - Request to Pay

```javascript
// Backend automatically handles this when user selects MTN MoMo
const result = await mtnMomoService.requestToPay({
  amount: 10.00,
  currency: 'EUR', // or 'XAF' for production
  phoneNumber: '237670000000',
  payerMessage: 'Payment for Module 1',
  payeeNote: 'CloudLiteracy - Pre-DevOps Module',
  externalId: 'payment_id_12345'
});

// Response:
{
  success: true,
  referenceId: 'uuid-v4-reference',
  message: 'Transaction initiated successfully',
  timestamp: '2024-01-15T10:30:00.000Z',
  duration: 1250
}
```

### Check Transaction Status

```javascript
// Poll for status (recommended: every 5 seconds for 2 minutes)
const status = await mtnMomoService.getTransactionStatus(referenceId);

// Response:
{
  success: true,
  referenceId: 'uuid-v4-reference',
  transactionId: 'mtn-financial-transaction-id',
  amount: '10.00',
  currency: 'EUR',
  payer: {
    partyIdType: 'MSISDN',
    partyId: '******0000' // Masked for security
  },
  status: 'SUCCESSFUL', // or 'PENDING', 'FAILED', 'REJECTED'
  timestamp: '2024-01-15T10:31:30.000Z',
  summary: '✅ Transaction SUCCESSFUL: 10.00 EUR from ******0000'
}
```

### Orange Money - Initiate Payment

```javascript
const result = await orangeMoneyService.initiatePayment({
  amount: 5000,
  currency: 'XAF',
  phoneNumber: '237690000000',
  description: 'CloudLiteracy Module Purchase',
  reference: 'payment_id_12345'
});

// Response:
{
  success: true,
  orderId: 'OM-1234567890-ABCD',
  paymentToken: 'token-xyz',
  paymentUrl: 'https://payment.orange.cm/...',
  message: 'Payment initiated successfully'
}
```

---

## 🔄 Transaction Status Codes

### MTN Mobile Money
| Status | Description | Action |
|--------|-------------|--------|
| `SUCCESSFUL` | Payment completed | Unlock module, send confirmation |
| `PENDING` | Awaiting user approval | Continue polling |
| `FAILED` | Payment failed | Show error, allow retry |
| `REJECTED` | User rejected payment | Show message, allow retry |

### Orange Money
| Status | Description | Action |
|--------|-------------|--------|
| `SUCCESS` | Payment completed | Unlock module, send confirmation |
| `PENDING` | Processing | Continue polling |
| `FAILED` | Payment failed | Show error, allow retry |
| `EXPIRED` | Payment timeout | Show message, allow retry |
| `CANCELLED` | User cancelled | Show message, allow retry |

---

## 📊 Logging & Monitoring

### Log Levels
- **INFO**: Normal operations (token refresh, status checks)
- **SUCCESS**: Successful transactions
- **ERROR**: Failed transactions, API errors
- **WARN**: Unusual but non-critical events

### Log Format
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "MTN_MOMO",
  "level": "SUCCESS",
  "message": "Transaction status: SUCCESSFUL",
  "environment": "production",
  "referenceId": "uuid-v4",
  "status": "SUCCESSFUL",
  "amount": "10.00",
  "currency": "EUR",
  "duration": "1250ms"
}
```

### What Gets Logged
✅ Transaction initiation
✅ Token generation/refresh
✅ Status queries
✅ Success/failure outcomes
✅ Error details
✅ Response times

### What NEVER Gets Logged
❌ Full phone numbers (always masked)
❌ API keys or secrets
❌ Access tokens
❌ User passwords
❌ Credit card details

---

## 🧪 Testing

### Sandbox Testing - MTN MoMo
```bash
# Test phone numbers (provided by MTN):
# Success: 46733123450
# Pending: 46733123451
# Failed: 46733123452

# Test amounts:
# Any amount works in sandbox
# Currency: EUR (sandbox only)
```

### Sandbox Testing - Orange Money
```bash
# Test credentials provided by Orange
# Use sandbox environment for testing
# Currency: XAF
```

### Test Mode Fallback
If credentials are not configured, the system automatically falls back to test mode:
```javascript
// Returns test URL for manual completion
{
  message: 'MTN MoMo payment initiated (TEST MODE)',
  paymentId: '...',
  testUrl: 'http://localhost:3000/payment/momo-test?paymentId=...',
  isTestMode: true
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Missing required MTN MoMo credentials"
**Solution**: Verify all environment variables are set in `.env` file
```bash
# Check if variables are loaded
node -e "console.log(process.env.MTN_MOMO_API_USER)"
```

#### 2. "Authentication failed"
**Solution**: 
- Verify API User and API Key are correct
- Check if Subscription Key matches the environment (sandbox/production)
- Ensure API User was created successfully

#### 3. "Token generation failed"
**Solution**:
- Check internet connectivity
- Verify MTN MoMo service is operational
- Check if subscription is active

#### 4. "Transaction not found"
**Solution**:
- Verify reference ID is correct
- Check if transaction was actually initiated
- Ensure sufficient time has passed (transactions take 5-30 seconds)

#### 5. "Payment timeout"
**Solution**:
- User may have closed the USSD prompt
- Network issues on user's side
- Insufficient balance in user's account

---

## 🔐 Security Best Practices

### 1. Environment Variables
```bash
# Never commit .env file to version control
echo ".env" >> .gitignore

# Use different credentials for each environment
# Development: Sandbox credentials
# Production: Production credentials
```

### 2. Token Management
- Tokens are cached and auto-refreshed
- Never log access tokens
- Tokens expire after 1 hour (automatically handled)

### 3. Phone Number Validation
```javascript
// Always validate phone numbers before API calls
// Format: Country code + number (e.g., 237670000000)
// Length: 10-15 digits
```

### 4. Amount Validation
```javascript
// Validate amounts are positive numbers
// Use proper decimal handling
// Match currency to environment (EUR for sandbox, XAF for production)
```

### 5. Error Handling
```javascript
// Never expose internal errors to users
// Log detailed errors server-side
// Show user-friendly messages to clients
```

---

## 📈 Production Checklist

### Before Going Live

- [ ] Business registration completed
- [ ] MTN MoMo production credentials obtained
- [ ] Orange Money production credentials obtained
- [ ] Environment variables updated for production
- [ ] Callback URLs configured and tested
- [ ] SSL certificate installed (HTTPS required)
- [ ] Logging system configured
- [ ] Error monitoring setup (e.g., Sentry)
- [ ] Transaction reconciliation process established
- [ ] Customer support process defined
- [ ] Refund policy documented
- [ ] Terms of service updated
- [ ] Privacy policy updated
- [ ] Load testing completed
- [ ] Security audit performed

### Monitoring

Set up alerts for:
- Failed transactions (>5% failure rate)
- Token generation failures
- API response time (>3 seconds)
- Unusual transaction patterns
- Service downtime

---

## 📞 Support Contacts

### MTN Mobile Money
- Developer Portal: https://momodeveloper.mtn.com
- Support Email: api@mtn.com
- Documentation: https://momodeveloper.mtn.com/api-documentation

### Orange Money
- Business Support: business@orange.cm
- Technical Support: api-support@orange.com
- Documentation: Provided upon merchant approval

---

## 📝 API Endpoints

### Backend Endpoints

```bash
# Initiate payment (MTN or Orange)
POST /api/payments/initiate
Body: {
  moduleId: "...",
  paymentMethod: "mtn_momo" | "orange_money",
  phoneNumber: "237670000000"
}

# Check MTN MoMo status
GET /api/payments/mtn-momo/status/:referenceId

# Check Orange Money status
GET /api/payments/orange-money/status/:orderId

# Test mode completion (fallback)
POST /api/payments/complete-mobile-money
Body: { paymentId: "..." }
```

---

## 🎯 Next Steps

1. **Development**: Use test mode to develop and test UI
2. **Sandbox**: Configure sandbox credentials and test with real APIs
3. **Production**: Apply for production access from MTN and Orange
4. **Go Live**: Update credentials and launch
5. **Monitor**: Set up monitoring and alerting
6. **Optimize**: Analyze transaction data and improve conversion

---

## 📚 Additional Resources

- [MTN MoMo API Documentation](https://momodeveloper.mtn.com/api-documentation)
- [Orange Money Developer Guide](https://developer.orange.com)
- [CloudLiteracy Payment Integration](../README.md)

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintained By**: CloudLiteracy Development Team
