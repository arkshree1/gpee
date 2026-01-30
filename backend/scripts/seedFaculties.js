/**
 * Seed Script: Populate Faculty collection with RGIPT faculty members
 * Run with: node scripts/seedFaculties.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Faculty model
const Faculty = require('../models/Faculty');

// Hash password
const hashedPassword = bcrypt.hashSync('12345678', 10);

// All faculties organized by department
const facultiesData = [
  // Department of Chemical Engineering
  { name: 'Prof. Amit Ranjan', email: 'aranjan@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. Milan Kumar', email: 'mkumar@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. Rakesh Kumar', email: 'rkumar@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. Gunjan Kumar Agrahari', email: 'gagrahari@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. VS Sistla', email: 'vsistla@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. Supriya Pulipaka', email: 'supriya@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. Deepak Dwivedi', email: 'ddwivedi@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. Vivek Kumar', email: 'vivekk@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. Karan Malik', email: 'kmallik@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. Shweta', email: 'sjatav@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. Arvind Singh', email: 'arvind.singh@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. Arvind Singh', email: 'arvindksingh@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. KG Biswas', email: 'kbiswas@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Prof. M.S. Balathanigaimani', email: 'msbala@rgipt.ac.in', department: 'Department of Chemical Engineering' },
  { name: 'Dr. Debashish Panda', email: 'dpanda.che@rgipt.ac.in', department: 'Department of Chemical Engineering' },

  // Department of Mechanical Engineering
  { name: 'Dr. Naveen Mani Tripathi', email: 'nmtripathi@rgipt.ac.in', department: 'Department of Mechanical Engineering' },
  { name: 'Dr. Tushar Sharma', email: 'tsharma@rgipt.ac.in', department: 'Department of Mechanical Engineering' },

  // Department of Petroleum Engineering
  { name: 'Prof. Satish Kr. Sinha', email: 'ssinha@rgipt.ac.in', department: 'Department of Petroleum Engineering' },
  { name: 'Dr. Amit Kumar', email: 'amitk@rgipt.ac.in', department: 'Department of Petroleum Engineering' },
  { name: 'Dr. Hemant Kr. Singh', email: 'hemantks@rgipt.ac.in', department: 'Department of Petroleum Engineering' },
  { name: 'Prof. Alok Kr. Singh', email: 'asingh@rgipt.ac.in', department: 'Department of Petroleum Engineering' },
  { name: 'Dr. Shailesh Kumar', email: 'shailesh@rgipt.ac.in', department: 'Department of Petroleum Engineering' },
  { name: 'Dr. Vishnu C. Nair', email: 'vishnuc@rgipt.ac.in', department: 'Department of Petroleum Engineering' },
  { name: 'Dr. Amit Saxena', email: 'asaxena@rgipt.ac.in', department: 'Department of Petroleum Engineering' },
  { name: 'Dr. Shivanjali Sharma', email: 'ssharma@rgipt.ac.in', department: 'Department of Petroleum Engineering' },
  { name: 'Dr. Piyush Sarkar', email: 'piyush.s@rgipt.ac.in', department: 'Department of Petroleum Engineering' },
  { name: 'Dr. Sidharth Gautam', email: 'sidharth@rgipt.ac.in', department: 'Department of Petroleum Engineering' },
  { name: 'Dr. Siddhant Kr. Prasad', email: 'skprasad@rgipt.ac.in', department: 'Department of Petroleum Engineering' },

  // Mathematical Sciences
  { name: 'Prof. Chanchal Kundu', email: 'ckundu@rgipt.ac.in', department: 'Department of Mathematical Sciences' },
  { name: 'Dr. G. Rakshit', email: 'g.rakshit@rgipt.ac.in', department: 'Department of Mathematical Sciences' },
  { name: 'Dr. Alpesh Kumar', email: 'alpeshk@rgipt.ac.in', department: 'Department of Mathematical Sciences' },
  { name: 'Dr. Soniya Dhama', email: 'soniyad@rgipt.ac.in', department: 'Department of Mathematical Sciences' },
  { name: 'Dr. Sudeep Kundu', email: 'sudeep.kundu@rgipt.ac.in', department: 'Department of Mathematical Sciences' },
  { name: 'Dr. Pradeep Das', email: 'pardeepd@rgipt.ac.in', department: 'Department of Mathematical Sciences' },

  // Electrical and Electronic Department
  { name: 'Dr. UD Dwivedi', email: 'udwivedi@rgipt.ac.in', department: 'Department of Electrical and Electronics Engineering' },
  { name: 'Dr. S Sundaram', email: 'ssundaram@rgipt.ac.in', department: 'Department of Electrical and Electronics Engineering' },
  { name: 'Dr. Shivanshu Shrivastava', email: 'sshrivastava@rgipt.ac.in', department: 'Department of Electrical and Electronics Engineering' },
  { name: 'Dr. Amarish Dubey', email: 'amrish.dubey@rgipt.ac.in', department: 'Department of Electrical and Electronics Engineering' },
  { name: 'Dr. Abhishek Kr. Singh', email: 'aks@rgipt.ac.in', department: 'Department of Electrical and Electronics Engineering' },
  { name: 'Dr. Sajal Agarwal', email: 'sagarwal@rgipt.ac.in', department: 'Department of Electrical and Electronics Engineering' },
  { name: 'Dr. Ankur Pandey', email: 'apandey@rgipt.ac.in', department: 'Department of Electrical and Electronics Engineering' },
  { name: 'Dr. Saptarshi Ghosh', email: 'sghosh@rgipt.ac.in', department: 'Department of Electrical and Electronics Engineering' },
  { name: 'Dr. Bheemaiah Chikondra', email: 'bchikondra@rgipt.ac.in', department: 'Department of Electrical and Electronics Engineering' },

  // Energy and Human Science (Humanities/Sciences)
  { name: 'Prof. A.K. Choubey', email: 'achoubey@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Dr. Debashish Panda', email: 'dpanda@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Prof. Atul Sharma', email: 'asharma@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Prof. ASK Sinha', email: 'asksinha@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Prof. U Ojha', email: 'uojha@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Dr. Arshad Aijaz', email: 'aaijaz@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Dr. Vipin Amoli', email: 'vamoli@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Dr. Tathamay Basu', email: 'tathamay.basu@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Dr. Omvir Singh', email: 'omvirs@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Dr. Shikha Singh', email: 'shikhas@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Dr. Tanmoy Ghosh', email: 'tghosh@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Dr. Malaya Kr. Sahoo', email: 'malayaks@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Dr. Anirban Mukherjee', email: 'amukharjee@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },
  { name: 'Dr. Praveen Kr. Srivastava', email: 'pksrivastava@rgipt.ac.in', department: 'Department of Humanities and Social Sciences' },

  // Computer Science & Engineering
  { name: 'Dr. Susham Biswas', email: 'susham@rgipt.ac.in', department: 'Department of Computer Science and Engineering' },
  { name: 'Dr. Gargi Srivastava', email: 'gsrivastava@rgipt.ac.in', department: 'Department of Computer Science and Engineering' },
  { name: 'Dr. Kalka Dubey', email: 'kalka.dubey@rgipt.ac.in', department: 'Department of Computer Science and Engineering' },
  { name: 'Dr. Dayasagar Gupta', email: 'dsgupta@rgipt.ac.in', department: 'Department of Computer Science and Engineering' },
  { name: 'Dr. Santosh Kr. Mishra', email: 'santosh.mishra@rgipt.ac.in', department: 'Department of Computer Science and Engineering' },
  { name: 'Dr. Nirbhay Kr. Tagore', email: 'nktagore@rgipt.ac.in', department: 'Department of Computer Science and Engineering' },

  // Management Studies
  { name: 'Dr. Saroj Kr. Mishra', email: 'skrmishra@rgipt.ac.in', department: 'Department of Management Studies' },
  { name: 'Dr. Kavita Srivastava', email: 'ksrivastava@rgipt.ac.in', department: 'Department of Management Studies' },
  { name: 'Dr. Jaya Srivastava', email: 'jsrivastava@rgipt.ac.in', department: 'Department of Management Studies' },
  { name: 'Dr. Rohit Bansal', email: 'rbansal@rgipt.ac.in', department: 'Department of Management Studies' },
  { name: 'Dr. Shrawan Trivedi', email: 'strivedi@rgipt.ac.in', department: 'Department of Management Studies' },
  { name: 'Prof. Sanjay Kumar Kar', email: 'sanjay.knm@rgipt.ac.in', department: 'Department of Management Studies' },
];

async function seedFaculties() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in environment variables!');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.\n');

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const faculty of facultiesData) {
      try {
        // Check if faculty with this email already exists
        const existing = await Faculty.findOne({ email: faculty.email.toLowerCase() });
        if (existing) {
          console.log(`⏭️  Skipped (exists): ${faculty.name} - ${faculty.email}`);
          skipped++;
          continue;
        }

        // Create new faculty
        const newFaculty = new Faculty({
          name: faculty.name,
          email: faculty.email.toLowerCase(),
          password: hashedPassword,
          department: faculty.department,
        });

        await newFaculty.save();
        console.log(`✅ Inserted: ${faculty.name} - ${faculty.email} (${faculty.department})`);
        inserted++;
      } catch (err) {
        if (err.code === 11000) {
          console.log(`⏭️  Skipped (duplicate): ${faculty.name} - ${faculty.email}`);
          skipped++;
        } else {
          console.error(`❌ Error inserting ${faculty.name}: ${err.message}`);
          errors++;
        }
      }
    }

    console.log('\n========================================');
    console.log(`Total: ${facultiesData.length}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

seedFaculties();
