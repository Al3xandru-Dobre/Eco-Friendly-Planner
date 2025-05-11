const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [ // Validare simplă pentru email
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, // Nu returna parola by default la query-uri
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware Mongoose: Hash password before saving
UserSchema.pre('save', async function (next) {
  // Rulează funcția doar dacă parola a fost modificată (sau e nouă)
  if (!this.isModified('password')) {
    return next();
  }
  // Hash parola cu un cost de 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Metodă pe instanță pentru a compara parolele
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);