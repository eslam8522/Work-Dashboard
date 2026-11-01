import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['SUPERADMIN', 'ADMIN', 'WORKER'], default: 'WORKER' },
    balance: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    otp: String,
    otpExpires: Date,
  },
  { timestamps: true }
);

// Passwords are hashed here, once. Controllers must always pass the plain password.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export default mongoose.model('User', userSchema);
