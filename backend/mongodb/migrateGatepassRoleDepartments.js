/*
 * One-time migration script to move `branch` -> `department`
 * for OfficeSecretary, Hod, and Dugc collections.
 *
 * Run with:
 *   node mongodb/migrateGatepassRoleDepartments.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

async function migrateCollection(collectionName, label) {
  const collection = mongoose.connection.collection(collectionName);

  // Use aggregation-style update so we can copy existing branch value
  const result = await collection.updateMany(
    { branch: { $exists: true } },
    [
      { $set: { department: '$branch' } },
      { $unset: 'branch' },
    ]
  );

  if (!result.matchedCount) {
    console.log(`No ${label} docs with branch field found, skipping.`);
    return;
  }

  console.log(
    `Migrated ${result.modifiedCount}/${result.matchedCount} ${label} docs from branch -> department.`,
  );
}

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    await migrateCollection('officesecretaries', 'OfficeSecretary');
    await migrateCollection('hods', 'Hod');
    await migrateCollection('dugcs', 'Dugc');

    console.log('✅ Migration complete');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

run();
