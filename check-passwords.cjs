require('dotenv').config({ path: 'server/.env' });

const mongoose = require('mongoose');

async function checkPasswords() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const users = await mongoose.connection.db
      .collection('instructors')
      .find({}, { projection: { username: 1, password: 1, _id: 0 } })
      .toArray();

    for (const user of users) {
      const isHashed =
        typeof user.password === 'string' &&
        /^\$2[aby]\$\d{2}\$/.test(user.password);

      console.log(
        `${user.username}: ${isHashed ? 'Hashed correctly' : 'NOT HASHED'}`
      );
    }
  } catch (error) {
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkPasswords();