/*
 * Seed script for gatepass approval roles.
 * Run with:
 *   node mongodb/seedGatepassRoles.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const OfficeSecretary = require('../models/OfficeSecretary');
const Hod = require('../models/Hod');
const Dugc = require('../models/Dugc');
const HostelOffice = require('../models/HostelOffice');

const mongoUri = process.env.MONGODB_URI;

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    const officeSecretaries = [
      {
        name: 'CS Office Secretary',
        email: 'office.cs@gpee.ac.in',
        department: 'CSE',
        password: '$2b$10$6E72P1.6tL3fEtuU7Bn5YO4tBVZO62sVqlKBHn.Zz0Q9sK/Aw045m',
      },
      {
        name: 'CHE Office Secretary',
        email: 'office.che@gpee.ac.in',
        department: 'CHEMICAL',
        password: '$2b$10$wPJ2nFui/lVPu4dakTpske1US/1HvBKM9H0bIBUf79aNGQYt.PLPO',
      },
    ];

    const hods = [
      {
        name: 'CSE HOD',
        email: 'hod.cs@gpee.ac.in',
        department: 'CSE',
        password: '$2b$10$d80lDM0FDDfZ/SZRWLHv5eTUwq/1b1HEzz7ETcyLFNkiTahDtEAI6',
      },
      {
        name: 'CHE HOD',
        email: 'hod.che@gpee.ac.in',
        department: 'CHEMICAL',
        password: '$2b$10$GDMc0LzoYI9LBkWfyrfDvu2pJVRg0vDhvsLJNAYniKuol5.f9lWIC',
      },
    ];

    const dugcs = [
      {
        name: 'CSE DUGC',
        email: 'dugc.cs@gpee.ac.in',
        department: 'CSE',
        password: '$2b$10$m.SS5kYtgOPzks10E0vmaOPsDdB9Nfgu7uDmSDD.yEdrNPQaq6mwu',
      },
      {
        name: 'CHE DUGC',
        email: 'dugc.che@gpee.ac.in',
        department: 'CHEMICAL',
        password: '$2b$10$MBUmxzNY.XpZeFYSsW98Weq6Yn/SSulLnZvybHYhfn5yhXYP9JKum',
      },
    ];

    const hostelOffices = [
      {
        email: 'hostel.main@gpee.ac.in',
        password: '$2b$10$cuGbK.GBxly55QwE5cXvn.eMJkUbexspM3q5sbhtA34bxmGXYllKG',
      },
      {
        email: 'hostel.boys@gpee.ac.in',
        password: '$2b$10$a8rXo9infOHpECAGCBTwEeHhqxEQmuwCbXxo8Pke6kjYv83u/QrOe',
      },
    ];

    await OfficeSecretary.deleteMany({});
    await Hod.deleteMany({});
    await Dugc.deleteMany({});
    await HostelOffice.deleteMany({});

    await OfficeSecretary.insertMany(officeSecretaries);
    await Hod.insertMany(hods);
    await Dugc.insertMany(dugcs);
    await HostelOffice.insertMany(hostelOffices);

    console.log('✅ Seeded gatepass role users successfully');
  } catch (err) {
    console.error('❌ Error seeding gatepass roles:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
