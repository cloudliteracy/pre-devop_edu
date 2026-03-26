const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePhoto: { type: String },
  country: { type: String },
  role: { type: String, enum: ['user', 'admin', 'partner'], default: 'user' },
  partnerTier: { type: String, enum: ['Silver', 'Gold', 'Platinum', 'Diamond'] },
  partnerAccessCode: { type: String },
  isSuperAdmin: { type: Boolean, default: false },
  canCreateSuperAdmins: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false },
  canUploadContent: { type: Boolean, default: false },
  canViewQuizAnalytics: { type: Boolean, default: false },
  canViewSurveyAnalytics: { type: Boolean, default: false },
  canManageAnnouncements: { type: Boolean, default: false },
  canAccessHelpDesk: { type: Boolean, default: false },
  isCsrUser: { type: Boolean, default: false },
  csrCodeUsed: { type: mongoose.Schema.Types.ObjectId, ref: 'CSRCode' },
  csrAccessExpiresAt: { type: Date },
  csrAccessRenewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  csrAccessRenewedAt: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  purchasedModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
  quizScores: [{
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    score: Number,
    completedAt: Date
  }]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
