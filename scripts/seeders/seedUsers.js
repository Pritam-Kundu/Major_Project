const User = require("../../models/user.js");

// Detailed realistic demographic data
const maleFirstNames = ["Aarav", "Liam", "Noah", "Oliver", "Elijah", "William", "James", "Benjamin", "Lucas", "Henry", "Alexander", "Sato", "Kenji", "Omar", "Tariq", "Pierre", "Luca"];
const femaleFirstNames = ["Diya", "Olivia", "Emma", "Charlotte", "Amelia", "Ava", "Sophia", "Isabella", "Mia", "Evelyn", "Harper", "Yuki", "Aisha", "Fatima", "Chloe", "Giulia", "Marie"];
const lastNames = ["Patel", "Sharma", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Tanaka", "Suzuki", "Al Hashmi", "Dubois", "Rossi", "Müller"];

const countriesAndCities = [
    { country: "India", cities: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune"] },
    { country: "USA", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Miami"] },
    { country: "UK", cities: ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow"] },
    { country: "Canada", cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"] },
    { country: "Australia", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"] },
    { country: "Germany", cities: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"] },
    { country: "France", cities: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"] },
    { country: "Italy", cities: ["Rome", "Milan", "Naples", "Turin", "Florence"] },
    { country: "Japan", cities: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Sapporo"] },
    { country: "Singapore", cities: ["Singapore"] },
    { country: "UAE", cities: ["Dubai", "Abu Dhabi", "Sharjah"] }
];

const travelPreferences = [
    "Solo Traveller", "Business Traveller", "Couple Traveller", "Family Traveller", 
    "Luxury Traveller", "Budget Traveller", "Backpacker", "Weekend Traveller", "Adventure Traveller"
];

const maleAvatars = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
];

const femaleAvatars = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"
];

const bios = [
    "Avid traveler always looking for the next adventure.",
    "Business professional traveling frequently.",
    "Photography enthusiast exploring the world.",
    "Foodie searching for the best local cuisines.",
    "Just someone who loves relaxing on a beach.",
    "Exploring the globe one city at a time.",
    "Digital nomad working from beautiful locations.",
    "Family-oriented person planning the perfect vacations.",
    "Backpacker on a tight budget but big dreams.",
    "Enjoying luxury stays and premium hospitality."
];

// Helpers
const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomDate = (monthsBack) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - monthsBack);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function seedUsers() {
    console.log("--- Seeding Users ---");
    
    // Determine how many users to generate (100 - 150)
    const totalUsers = randomInt(100, 150);
    const generatedUsers = [];

    let currentUsersCount = await User.countDocuments({ email: { $regex: /@eco-demo\.com$/ } });
    if (currentUsersCount >= 100) {
        console.log(`Ecosystem demo users already exist. Skipping creation to prevent duplicates.`);
        return await User.find({ email: { $regex: /@eco-demo\.com$/ } });
    }

    for (let i = 1; i <= totalUsers; i++) {
        const isMale = Math.random() > 0.5;
        const firstName = randomEl(isMale ? maleFirstNames : femaleFirstNames);
        const lastName = randomEl(lastNames);
        const fullName = `${firstName} ${lastName}`;
        const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${i}`;
        const email = `${username}@eco-demo.com`; // Unique domain to identify demo users
        
        const loc = randomEl(countriesAndCities);
        const city = randomEl(loc.cities);
        
        const avatar = randomEl(isMale ? maleAvatars : femaleAvatars);
        
        const user = new User({
            username: username,
            email: email,
            profileAvatar: avatar,
            city: city,
            country: loc.country,
            memberSince: randomDate(12), // Joined sometime in the last 12 months
            bio: randomEl(bios),
            preferredLanguage: "English",
            travelPreference: randomEl(travelPreferences),
            isAdmin: false
        });

        // Register user with a standard password
        const registeredUser = await User.register(user, 'ecosystem123');
        generatedUsers.push(registeredUser);
    }

    console.log(`Successfully generated ${generatedUsers.length} diverse demo users.`);
    return generatedUsers;
}

module.exports = seedUsers;
