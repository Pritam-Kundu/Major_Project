const mongoose = require('mongoose');
const User = require('../models/user.js');

mongoose.connect('mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    const countries = ['UK', 'France', 'Germany', 'Australia', 'Japan', 'India'];
    const users = await User.find({ country: { $exists: false } });
    
    for (let u of users) {
        u.country = countries[Math.floor(Math.random() * countries.length)];
        await u.save();
    }
    
    const nullCountryUsers = await User.find({ country: null });
    for (let u of nullCountryUsers) {
        u.country = countries[Math.floor(Math.random() * countries.length)];
        await u.save();
    }
    
    console.log('Fixed countries for old users.');
    process.exit(0);
});
