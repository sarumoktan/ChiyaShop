const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const env = require('../config/env');

class User extends Model {
  /** Compare a plaintext password against the stored bcrypt hash. */
  async verifyPassword(plain) {
    if (!plain || !this.passwordHash) return false;
    return bcrypt.compare(plain, this.passwordHash);
  }

  /** Shape safe for API responses — never leaks the hash. */
  toPublic() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      phone: this.phone,
      address: this.address,
      city: this.city,
      avatarUrl: this.avatarUrl,
      createdAt: this.createdAt,
    };
  }

  toJSON() {
    return this.toPublic();
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: { len: { args: [2, 80], msg: 'Name must be 2-80 characters.' } },
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: { msg: 'That email is already registered.' },
      set(value) {
        this.setDataValue('email', String(value || '').trim().toLowerCase());
      },
      validate: { isEmail: { msg: 'Enter a valid email address.' } },
    },
    // Virtual: assign `user.password = '...'` and the hook hashes it.
    password: {
      type: DataTypes.VIRTUAL,
      validate: {
        len: { args: [8, 128], msg: 'Password must be at least 8 characters.' },
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    address: { type: DataTypes.STRING(255), allowNull: true },
    city: { type: DataTypes.STRING(80), allowNull: true },
    avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    defaultScope: { attributes: { exclude: ['passwordHash'] } },
    scopes: {
      withPassword: { attributes: { include: ['passwordHash'] } },
    },
    hooks: {
      beforeSave: async (user) => {
        if (user.password) {
          user.passwordHash = await bcrypt.hash(user.password, env.bcryptRounds);
          user.password = undefined;
        }
      },
    },
  }
);

module.exports = User;
