const mongoose = require("mongoose")
const initData = require("../init/data.js")
const Listing = require("../models/listing.js")

const MONGO_URL = "mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0";

main()
    .then(() => {
        console.log("Connected to MongoDB Atlas");
    })
    .catch((err) => {
        console.error("Connection error:", err);
    });

async function main() {
    await mongoose.connect(MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
}



const initDB = async () => {
    await Listing.deleteMany({})        //deleting previous datas 
    initData.data = initData.data.map((obj) => ({...obj, owner: "68583647e4afe8953e50a221"}))
    await Listing.insertMany(initData.data)         // inserting new data, ["data" is the name of the array in data.js]
    console.log("data was initialized")
}

initDB();