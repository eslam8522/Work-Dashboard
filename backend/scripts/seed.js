// Creates demo accounts and sample studies so the app can be tried straight away.
// Usage: npm run seed   (refuses to run when NODE_ENV=production)
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Study from '../models/Study.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed demo data in production.');
  process.exit(1);
}
if (!process.env.MONGO_DB_URI) {
  console.error('Missing MONGO_DB_URI. Copy .env.example to .env first.');
  process.exit(1);
}

const PASSWORD = 'Password123!';
const demoUsers = [
  { email: 'superadmin@example.com', role: 'SUPERADMIN' },
  { email: 'admin@example.com', role: 'ADMIN' },
  { email: 'worker@example.com', role: 'WORKER' },
];

await mongoose.connect(process.env.MONGO_DB_URI);

const created = {};
for (const { email, role } of demoUsers) {
  created[role] = (await User.findOne({ email })) || (await User.create({ email, password: PASSWORD, role }));
}

if ((await Study.countDocuments({ adminId: created.ADMIN._id })) === 0) {
  const studies = [
    ['Consumer habits in online shopping', 'A 5 minute questionnaire about how you shop online.', 1.5, 50],
    ['Remote work and productivity', 'Tell us how your work routine changed since going remote.', 2.25, 30],
    ['Mobile app usability survey', 'Rate the navigation of a prototype app.', 0.75, 100],
  ];
  await Study.insertMany(
    studies.map(([title, description, rewardPerWorker, maxParticipants], i) => ({
      title,
      description,
      surveyUrl: 'https://example.com/survey',
      rewardPerWorker,
      maxParticipants,
      availableSpots: maxParticipants,
      completionCode: `DEMO${i + 1}`,
      adminId: created.ADMIN._id,
      status: 'ACTIVE',
    }))
  );
}

console.log('Seed complete. Demo logins (password for all: ' + PASSWORD + '):');
demoUsers.forEach((u) => console.log(`  ${u.role.padEnd(10)} ${u.email}`));
console.log('Demo completion codes for the sample studies: DEMO1, DEMO2, DEMO3');

await mongoose.disconnect();
