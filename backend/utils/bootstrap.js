const bcrypt = require('bcryptjs');
const Guard = require('../models/Guard');
const Admin = require('../models/Admin');

// Create default guard/admin accounts if they don't exist so teams can sign in
// immediately. Credentials can be overridden via env. Intended for dev/POC use
// only—production should provision accounts explicitly.
const DEFAULT_GUARD_EMAIL = process.env.DEFAULT_GUARD_EMAIL || 'guard@example.com';
const DEFAULT_GUARD_PASSWORD = process.env.DEFAULT_GUARD_PASSWORD || 'guard1234';
const DEFAULT_GUARD_NAME = process.env.DEFAULT_GUARD_NAME || 'Main Gate';

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin1234';
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || 'Campus Admin';

const ensureAccount = async (Model, query, createPayload) => {
  const exists = await Model.findOne(query);
  if (exists) return exists;

  const hashedPassword = await bcrypt.hash(createPayload.password, 10);
  const doc = await Model.create({ ...createPayload, password: hashedPassword });
  // eslint-disable-next-line no-console
  console.log(`🌱 Seeded account for ${Model.modelName}: ${createPayload.email}`);
  return doc;
};

const bootstrapDefaultAccounts = async () => {
  await ensureAccount(Guard, { email: DEFAULT_GUARD_EMAIL }, {
    name: DEFAULT_GUARD_NAME,
    email: DEFAULT_GUARD_EMAIL,
    password: DEFAULT_GUARD_PASSWORD,
  });

  await ensureAccount(Admin, { email: DEFAULT_ADMIN_EMAIL }, {
    name: DEFAULT_ADMIN_NAME,
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
  });
};

module.exports = {
  bootstrapDefaultAccounts,
};