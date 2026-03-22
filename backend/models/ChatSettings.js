const mongoose = require('mongoose');

const chatSettingsSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    default: true
  },
  disabledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  disabledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatSettings', chatSettingsSchema);
