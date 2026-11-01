import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Only used by the optional email-OTP login (needs EMAIL_USER / EMAIL_PASS).
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const SUSPENDED = 'Your account has been suspended by the platform administrator.';
const REGISTERABLE_ROLES = ['WORKER', 'ADMIN'];

/** The shape returned to the client after any successful login. */
const authResponse = (user) => ({
  _id: user._id,
  email: user.email,
  role: user.role,
  balance: user.balance,
  isBlocked: user.isBlocked,
  token: generateToken(user._id),
});

// --- Email + password ---
export const registerUser = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password, role = 'WORKER' } = req.body;

    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email.' });
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!REGISTERABLE_ROLES.includes(role)) {
      return res.status(403).json({ error: 'You cannot register with that role.' });
    }

    if (await User.findOne({ email })) return res.status(400).json({ error: 'User already exists' });

    // The model hashes the password on save, so pass it in plain.
    const user = await User.create({ email, password, role });
    res.status(201).json(authResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({ email });
    if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.isBlocked) return res.status(403).json({ error: SUSPENDED });

    res.json(authResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Google ---
export const googleLogin = async (req, res) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, email_verified } = ticket.getPayload();
    if (!email_verified) return res.status(400).json({ error: 'Your Google email is not verified.' });

    let user = await User.findOne({ email });

    // First Google sign-in creates a worker account with an unguessable password.
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await User.create({ email, password: randomPassword, role: 'WORKER' });
    }

    if (user.isBlocked) return res.status(403).json({ error: SUSPENDED });

    res.json(authResponse(user));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Google Login failed or token expired.' });
  }
};

// --- Optional: email one-time code ---
export const requestOtp = async (req, res) => {
  try {
    const user = await User.findOne({ email: String(req.body.email || '').trim().toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ error: SUSPENDED });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otpCode;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your Platform Login Code',
      text: `Your login code is: ${otpCode}. It will expire in 10 minutes.`,
    });
    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ error: 'Error sending email: ' + error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findOne({ email: String(req.body.email || '').trim().toLowerCase() });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ error: SUSPENDED });
    if (!user.otp || user.otp !== otp) return res.status(400).json({ error: 'Invalid verification code.' });
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json(authResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Current user (used to refresh the wallet balance) ---
export const getMe = (req, res) => {
  const { _id, email, role, balance, isBlocked } = req.user;
  res.json({ _id, email, role, balance, isBlocked });
};

// --- Super admin ---
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'SUPERADMIN' } })
      .select('-password -otp -otpExpires')
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'SUPERADMIN') return res.status(403).json({ error: 'A Super Admin cannot be blocked.' });

    user.isBlocked = !user.isBlocked;
    await user.save();

    const { _id, email, role, isBlocked } = user;
    res.status(200).json({
      message: `User has been ${isBlocked ? 'blocked' : 'unblocked'}`,
      user: { _id, email, role, isBlocked },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
