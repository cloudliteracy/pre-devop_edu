const crypto = require('crypto');

const generatePartnerAccessCode = (partnerTier) => {
  const tierPrefixes = {
    'Silver': 'SIL',
    'Gold': 'GOL',
    'Platinum': 'PLA',
    'Diamond': 'DIA'
  };
  const prefix = tierPrefixes[partnerTier] || 'PTR';
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
};

module.exports = { generatePartnerAccessCode };
