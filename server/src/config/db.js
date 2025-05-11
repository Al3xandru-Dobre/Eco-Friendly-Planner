const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useCreateIndex: true, // Nu mai e necesar în Mongoose 6+
      // useFindAndModify: false // Nu mai e necesar în Mongoose 6+
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    // Ieși din proces cu eroare
    process.exit(1);
  }
};

module.exports = connectDB;