const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0');
  const Listing = require('./models/listing.js');
  
  const asc = await Listing.aggregate([{ $sort: { price: 1 } }]);
  const desc = await Listing.aggregate([{ $sort: { price: -1 } }]);
  
  console.log('Asc prices:', asc.map(l => l.price).slice(0,10));
  console.log('Desc prices:', desc.map(l => l.price).slice(0,10));
  process.exit(0);
}

main().catch(console.error);
