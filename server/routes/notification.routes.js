
const express = require("express");


const authMiddleware = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notification.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);

router.patch("/read-all", notificationController.markAllAsRead);

router.delete("/", notificationController.clearNotifications);

router.patch("/:notificationId/read", notificationController.markAsRead);

router.delete("/:notificationId", notificationController.deleteNotification);

module.exports = router;
