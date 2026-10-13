
const Notification = require("../models/notification.model");

const createNotification = async ({
  recipient,
  actor = null,
  workspace = null,
  type,
  title,
  message,
  metadata = {},
}) => {
  const notification = await Notification.create({
    recipient,
    actor,
    workspace,
    type,
    title,
    message,
    metadata,
  });

  return Notification.findById(notification._id)
    .populate("actor", "username avatar")
    .populate("workspace", "name");
};

const getNotifications = async ({
  userId,
  page = 1,
  limit = 20,
}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(
    50,
    Math.max(1, Number(limit) || 20)
  );

  const filter = { recipient: userId };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate("actor", "username avatar")
      .populate("workspace", "name")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),

    Notification.countDocuments(filter),

    Notification.countDocuments({
      ...filter,
      readAt: null,
    }),
  ]);

  return {
    notifications,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
    unreadCount,
  };
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({
    recipient: userId,
    readAt: null,
  });
};

const markNotificationAsRead = async ({
  notificationId,
  userId,
}) => {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId,
    },
    {
      $set: { readAt: new Date() },
    },
    { new: true }
  )
    .populate("actor", "username avatar")
    .populate("workspace", "name");
};

const markAllNotificationsAsRead = async (userId) => {
  const result = await Notification.updateMany(
    {
      recipient: userId,
      readAt: null,
    },
    {
      $set: { readAt: new Date() },
    }
  );

  return result.modifiedCount;
};

const deleteNotification = async ({
  notificationId,
  userId,
}) => {
  return Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });
};

const clearNotifications = async (userId) => {
  const result = await Notification.deleteMany({
    recipient: userId,
  });

  return result.deletedCount;
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearNotifications,
};
