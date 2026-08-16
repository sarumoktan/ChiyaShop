const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');

const authPayload = (user) => ({
  token: signToken(user),
  user: user.toPublic(),
});

/** POST /api/auth/register */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ where: { email: String(email).toLowerCase() } });
  if (existing) throw ApiError.conflict('That email is already registered. Try signing in.');

  // `password` is a VIRTUAL field — the model's beforeSave hook bcrypt-hashes it.
  const user = await User.create({ name, email, password, phone: phone || null });

  res.status(201).json({
    success: true,
    message: `Welcome to Chiya Shop, ${user.name.split(' ')[0]}!`,
    data: authPayload(user),
  });
});

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.scope('withPassword').findOne({
    where: { email: String(email).toLowerCase() },
  });

  // Same message for unknown email and wrong password — no account enumeration.
  const ok = user && (await user.verifyPassword(password));
  if (!ok) throw ApiError.unauthorized('Incorrect email or password.');

  res.json({
    success: true,
    message: `Welcome back, ${user.name.split(' ')[0]}!`,
    data: authPayload(user),
  });
});

/** GET /api/auth/me */
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublic() } });
});

/** PATCH /api/auth/me */
const updateProfile = asyncHandler(async (req, res) => {
  const fields = ['name', 'phone', 'address', 'city', 'avatarUrl'];
  for (const field of fields) {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  }
  await req.user.save();

  res.json({
    success: true,
    message: 'Profile updated.',
    data: { user: req.user.toPublic() },
  });
});

/** POST /api/auth/change-password */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.scope('withPassword').findByPk(req.user.id);
  const ok = await user.verifyPassword(currentPassword);
  if (!ok) throw ApiError.badRequest('Your current password is incorrect.', {
    currentPassword: 'Incorrect password.',
  });

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated.', data: authPayload(user) });
});

module.exports = { register, login, me, updateProfile, changePassword };
