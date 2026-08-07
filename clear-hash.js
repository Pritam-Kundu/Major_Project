const mongoose = require('mongoose');
const MONGO_URL = "mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URL).then(async () => {
  const User = require('./models/user.js');
  const result = await User.updateMany({ email: 'paulabhik35@gmail.com' }, { $unset: { hash: 1, salt: 1 } });
  console.log(result);
  process.exit(0);
}).catch(console.error);
