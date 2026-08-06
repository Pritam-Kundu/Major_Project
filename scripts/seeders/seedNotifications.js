const Notification = require("../../models/notification.js");

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];

const notificationTypes = [
    { type: 'general', title: 'Special Offer', message: 'Get 20% off on your next beach vacation!', link: '/listings/search?category=beach' },
    { type: 'wishlist', title: 'Price Dropped!', message: 'A property on your wishlist just dropped its price.', link: '/wishlist' },
    { type: 'general', title: 'Weekend Deals', message: 'Check out these top trending weekend getaways.', link: '/listings' },
    { type: 'general', title: 'Flash Sale', message: 'Hurry! Flash sale ends in 24 hours.', link: '/listings' },
    { type: 'review', title: 'Review Reminder', message: 'Please leave a review for your recent stay.', link: '/trips' }
];

async function seedNotifications(users) {
    console.log("--- Seeding Notifications ---");

    const demoUserIds = users.map(u => u._id);
    await Notification.deleteMany({ user: { $in: demoUserIds } });

    let notificationsCreated = 0;

    for (let user of users) {
        // Each user gets 2-5 generic notifications
        const numNotifs = randomInt(2, 5);
        for (let i = 0; i < numNotifs; i++) {
            const template = randomEl(notificationTypes);
            
            const notif = new Notification({
                user: user._id,
                type: template.type,
                title: template.title,
                message: template.message,
                isRead: Math.random() > 0.5, // 50% chance it's read
                link: template.link,
                createdAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000)
            });

            await notif.save();
            notificationsCreated++;
        }
    }

    console.log(`Successfully generated ${notificationsCreated} demo notifications.`);
}

module.exports = seedNotifications;
