require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user.js");

const MONGO_URL = process.env.MONGO_URL || "mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0";

const email = process.argv[2];

if (!email) {
  console.error("Please provide an email address.");
  console.log("Usage: node makeAdmin.js user@example.com");
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(MONGO_URL);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`Error: User with email '${email}' not found.`);
      process.exit(1);
    }

    user.isAdmin = true;
    await user.save();
    console.log(`Success: User '${email}' is now an admin!`);
  } catch (err) {
    console.error("An error occurred:", err);
  } finally {
    mongoose.connection.close();
  }
}

main();
