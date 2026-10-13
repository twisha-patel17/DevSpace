
const mongoose = require("mongoose");

const notificationService = require("../services/notification.service");

const getNotifications = async (req, res) => {
  try {
    const result = await notificationService.getNotifications({
      userId: req.user.id,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await notificationService.getUnreadCount(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Get unread count error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread count.",
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification =
      await notificationService.markNotificationAsRead({
        notificationId,
        userId: req.user.id,
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notification.",
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const modifiedCount =
      await notificationService.markAllNotificationsAsRead(
        req.user.id
      );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount,
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notifications.",
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification =
      await notificationService.deleteNotification({
        notificationId,
        userId: req.user.id,
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted.",
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
    });
  }
};

const clearNotifications = async (req, res) => {
  try {
    const deletedCount =
      await notificationService.clearNotifications(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Notifications cleared.",
      deletedCount,
    });
  } catch (error) {
    console.error("Clear notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear notifications.",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
};
