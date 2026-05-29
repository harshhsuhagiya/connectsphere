const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password is required if not using Google Auth
    },
    select: false
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  avatar: {
    type: String,
    default: ''
  },
  colorHash: {
    type: String
  },
  bio: { type: String, maxlength: 160, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  timezone: { type: String, default: 'UTC' },
  language: { type: String, default: 'English' },
  theme: { type: String, default: 'system' },
  accentColor: { type: String, default: 'indigo' },
  fontSize: { type: String, default: 'default' },
  notifications: {
    meetingReminders: { type: Boolean, default: true },
    someoneJoinsRoom: { type: Boolean, default: true },
    fileShared: { type: Boolean, default: true },
    newChatMessage: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: false },
    productUpdates: { type: Boolean, default: false }
  },
  integrations: {
    googleCalendar: { type: Boolean, default: false },
    slack: { type: Boolean, default: false },
    github: { type: Boolean, default: false },
    notion: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Encrypt password using bcrypt and set colorHash
userSchema.pre('save', async function(next) {
  if (!this.colorHash && this.name) {
    const colors = ['indigo', 'violet', 'emerald', 'amber', 'rose', 'sky', 'teal', 'orange'];
    let hash = 0;
    for (let i = 0; i < this.name.length; i++) {
      hash = this.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    this.colorHash = colors[Math.abs(hash) % colors.length];
  }

  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
