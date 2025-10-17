const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // When MongoDB connects successfully
    mongoose.connection.on('connected', () => {
      console.log("Database Connected Successfully");
    });

    // Use proper connection string from .env
    await mongoose.connect(`${process.env.MONGODB_URI}/auth`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1); // Exit process if connection fails
  }
};

module.exports = connectDB;
