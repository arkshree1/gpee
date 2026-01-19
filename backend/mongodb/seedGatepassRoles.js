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

// Password hash for '12345678'
const hashedPassword = '$2b$10$DKciiwfCO8.pNBw1KvYH0ebbHXUOpG9uaJIk8gljpAVXB0BIigR5.';

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    const officeSecretaries = [
      {
        name: 'CSE Office Secretary',
        email: 'csedepartmentoffice@gmail.com',
        department: 'Computer Science and Engineering',
        password: hashedPassword,
      },
      {
        name: 'Chemical Office Secretary',
        email: 'chemicaldepartmentoffice@gmail.com',
        department: 'Chemical and Biochemical Engineering',
        password: hashedPassword,
      },
      {
        name: 'Electrical Office Secretary',
        email: 'electricaldepartmentoffice@gmail.com',
        department: 'Electrical and Electronics Engineering',
        password: hashedPassword,
      },
      {
        name: 'Management Office Secretary',
        email: 'managementdepartmentoffice@gmail.com',
        department: 'Management Studies',
        password: hashedPassword,
      },
      {
        name: 'Mathematics Office Secretary',
        email: 'mathematicsdepartmentoffice@gmail.com',
        department: 'Mathematical Sciences',
        password: hashedPassword,
      },
      {
        name: 'Mechanical Office Secretary',
        email: 'mechanicaldepartmentoffice@gmail.com',
        department: 'Mechanical Engineering',
        password: hashedPassword,
      },
      {
        name: 'Petroleum Office Secretary',
        email: 'petroleumdepartmentoffice@gmail.com',
        department: 'Petroleum Engineering and Geoengineering',
        password: hashedPassword,
      },
      {
        name: 'PHD Office Secretary',
        email: 'phddepartmentoffice@gmail.com',
        department: 'PHD',
        password: hashedPassword,
      },
    ];

    const hods = [
      {
        name: 'CSE HOD',
        email: 'csedepartmenthod@gmail.com',
        department: 'Computer Science and Engineering',
        password: hashedPassword,
      },
      {
        name: 'Chemical HOD',
        email: 'chemicaldepartmenthod@gmail.com',
        department: 'Chemical and Biochemical Engineering',
        password: hashedPassword,
      },
      {
        name: 'Electrical HOD',
        email: 'electricaldepartmenthod@gmail.com',
        department: 'Electrical and Electronics Engineering',
        password: hashedPassword,
      },
      {
        name: 'Management HOD',
        email: 'managementdepartmenthod@gmail.com',
        department: 'Management Studies',
        password: hashedPassword,
      },
      {
        name: 'Mathematics HOD',
        email: 'mathematicsdepartmenthod@gmail.com',
        department: 'Mathematical Sciences',
        password: hashedPassword,
      },
      {
        name: 'Mechanical HOD',
        email: 'mechanicaldepartmenthod@gmail.com',
        department: 'Mechanical Engineering',
        password: hashedPassword,
      },
      {
        name: 'Petroleum HOD',
        email: 'petroleumdepartmenthod@gmail.com',
        department: 'Petroleum Engineering and Geoengineering',
        password: hashedPassword,
      },
      {
        name: 'PHD HOD',
        email: 'phddepartmenthod@gmail.com',
        department: 'PHD',
        password: hashedPassword,
      },
    ];

    const dugcs = [
      {
        name: 'CSE DUGC',
        email: 'csedepartmentdugc@gmail.com',
        department: 'Computer Science and Engineering',
        password: hashedPassword,
      },
      {
        name: 'Chemical DUGC',
        email: 'chemicaldepartmentdugc@gmail.com',
        department: 'Chemical and Biochemical Engineering',
        password: hashedPassword,
      },
      {
        name: 'Electrical DUGC',
        email: 'electricaldepartmentdugc@gmail.com',
        department: 'Electrical and Electronics Engineering',
        password: hashedPassword,
      },
      {
        name: 'Management DUGC',
        email: 'managementdepartmentdugc@gmail.com',
        department: 'Management Studies',
        password: hashedPassword,
      },
      {
        name: 'Mathematics DUGC',
        email: 'mathematicsdepartmentdugc@gmail.com',
        department: 'Mathematical Sciences',
        password: hashedPassword,
      },
      {
        name: 'Mechanical DUGC',
        email: 'mechanicaldepartmentdugc@gmail.com',
        department: 'Mechanical Engineering',
        password: hashedPassword,
      },
      {
        name: 'Petroleum DUGC',
        email: 'petroleumdepartmentdugc@gmail.com',
        department: 'Petroleum Engineering and Geoengineering',
        password: hashedPassword,
      },
      {
        name: 'PHD DUGC',
        email: 'phddepartmentdugc@gmail.com',
        department: 'PHD',
        password: hashedPassword,
      },
    ];

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
