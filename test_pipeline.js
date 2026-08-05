const mongoose = require('mongoose');
const Listing = require('./models/listing.js');

async function main() {
  await mongoose.connect('mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0');
  
  // Get all listings sorted by _id: -1
  const listings = await Listing.find({}).sort({ _id: -1 });
  
  console.log(`Total listings: ${listings.length}`);
  
  let trendingCount = 0;
  let uniqueCount = 0;

  // From index 5 to 24 (max 20 properties) -> Trending
  const maxTrending = Math.min(listings.length, 25);
  for (let i = 5; i < maxTrending; i++) {
    listings[i].category = 'Trending';
    await listings[i].save();
    trendingCount++;
  }
  
  // For Unique stays, let's take the next 10 properties (or whatever is left)
  const maxUnique = Math.min(listings.length, 35);
  for (let i = maxTrending; i < maxUnique; i++) {
    listings[i].category = 'Unique';
    await listings[i].save();
    uniqueCount++;
  }
  
  console.log(`Updated ${trendingCount} properties to Trending.`);
  console.log(`Updated ${uniqueCount} properties to Unique Stays.`);

  process.exit(0);
}

main().catch(console.error);
