const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification");
const { isLoggedIn } = require("../middleware.js");

// All notification routes require the user to be logged in
router.use(isLoggedIn);

router.get("/", notificationController.getNotifications);
router.put("/read-all", notificationController.markAllAsRead);
router.put("/:id/read", notificationController.markAsRead);
router.delete("/clear-all", notificationController.clearAllNotifications);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
