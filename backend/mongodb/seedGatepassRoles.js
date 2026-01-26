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
const Faculty = require('../models/Faculty');
const Dpgc = require('../models/Dpgc');
const Dean = require('../models/Dean');

const mongoUri = process.env.MONGODB_URI;

// Password hash for '12345678'
const hashedPassword = '$2b$10$OpZLv3/Mrlb5emgtUNmEEuKOVpbVLJP.cbp8FgmplcjLGlQCJ/Df.';

// Departments list with short names for email IDs
const departments = [
  { short: 'cse', full: 'Computer Science and Engineering' },
  { short: 'chem', full: 'Chemical and Biochemical Engineering' },
  { short: 'ee', full: 'Electrical and Electronics Engineering' },
  { short: 'mba', full: 'Management Studies' },
  { short: 'math', full: 'Mathematical Sciences' },
  { short: 'mech', full: 'Mechanical Engineering' },
  { short: 'petro', full: 'Petroleum Engineering and Geoengineering' },
  { short: 'phd', full: 'PHD' },
  { short: 'energy', full: 'Energy and Human Sciences' },
];

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Office Secretaries - department wise
    const officeSecretaries = departments.map(dept => ({
      name: `${dept.full} Office Secretary`,
      email: `${dept.short}office@gmail.com`,
      department: dept.full,
      password: hashedPassword,
    }));

    // HODs - department wise
    const hods = departments.map(dept => ({
      name: `${dept.full} HOD`,
      email: `${dept.short}hod@gmail.com`,
      department: dept.full,
      password: hashedPassword,
    }));

    // DUGCs - department wise
    const dugcs = departments.map(dept => ({
      name: `${dept.full} DUGC`,
      email: `${dept.short}dugc@gmail.com`,
      department: dept.full,
      password: hashedPassword,
    }));

    // Faculty - department wise
    const faculties = departments.map(dept => ({
      name: `${dept.full} Faculty`,
      email: `${dept.short}faculty@gmail.com`,
      department: dept.full,
      password: hashedPassword,
    }));

    // DPGCs - department wise (new)
    const dpgcs = departments.map(dept => ({
      name: `${dept.full} DPGC`,
      email: `${dept.short}dpgc@gmail.com`,
      department: dept.full,
      password: hashedPassword,
    }));

    // Dean - single (not department wise)
    const deans = [
      {
        name: 'Dean',
        email: 'dean@gmail.com',
        password: hashedPassword,
      },
    ];

    // Hostel Offices
    const hostelOffices = [
      {
        email: 'hostel.main@gpee.ac.in',
        password: hashedPassword,
      },
      {
        email: 'hostel.boys@gpee.ac.in',
        password: hashedPassword,
      },
    ];

    // Clear existing data
    await OfficeSecretary.deleteMany({});
    await Hod.deleteMany({});
    await Dugc.deleteMany({});
    await HostelOffice.deleteMany({});
    await Faculty.deleteMany({});
    await Dpgc.deleteMany({});
    await Dean.deleteMany({});

    // Insert new data
    await OfficeSecretary.insertMany(officeSecretaries);
    await Hod.insertMany(hods);
    await Dugc.insertMany(dugcs);
    await HostelOffice.insertMany(hostelOffices);
    await Faculty.insertMany(faculties);
    await Dpgc.insertMany(dpgcs);
    await Dean.insertMany(deans);

    console.log('✅ Seeded gatepass role users successfully');
    console.log('\n📝 Created credentials (password for all: 12345678):');
    console.log('\n--- Office Secretaries ---');
    officeSecretaries.forEach(u => console.log(`  ${u.email} - ${u.department}`));
    console.log('\n--- HODs ---');
    hods.forEach(u => console.log(`  ${u.email} - ${u.department}`));
    console.log('\n--- DUGCs ---');
    dugcs.forEach(u => console.log(`  ${u.email} - ${u.department}`));
    console.log('\n--- Faculties ---');
    faculties.forEach(u => console.log(`  ${u.email} - ${u.department}`));
    console.log('\n--- DPGCs ---');
    dpgcs.forEach(u => console.log(`  ${u.email} - ${u.department}`));
    console.log('\n--- Dean ---');
    deans.forEach(u => console.log(`  ${u.email}`));
    console.log('\n--- Hostel Offices ---');
    hostelOffices.forEach(u => console.log(`  ${u.email}`));

  } catch (err) {
    console.error('❌ Error seeding gatepass roles:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seed();
