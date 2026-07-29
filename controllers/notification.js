const Notification = require("../models/notification");

module.exports.getNotifications = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 }) // Newest first
            .limit(50); // Limit to last 50 notifications for performance
            
        res.json({ notifications });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: req.user._id },
            { isRead: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }
        
        res.json({ success: true, notification });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Notification.deleteOne({ _id: id, user: req.user._id });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports.clearAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user._id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Helper function to create notifications from other controllers
module.exports.createNotification = async (userId, type, title, message, link = "#") => {
    try {
        const notification = new Notification({
            user: userId,
            type,
            title,
            message,
            link
        });
        await notification.save();
        return notification;
    } catch (err) {
        console.error("Failed to create notification:", err);
        // We don't throw because we don't want to break the main flow (e.g. booking creation) if a notification fails
    }
};
