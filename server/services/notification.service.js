const Notification = require("../models/notification.model");

let socketIO = null;

const setSocketIO = (io) => {
  socketIO = io;
};

const normalizeUserId = (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return userId.toString();
};

const createNotification = async ({
  recipient,
  actor = null,
  workspace = null,
  type,
  title,
  message,
  metadata = {},
}) => {
  const recipientId = normalizeUserId(recipient);

  const notification = await Notification.create({
    recipient: recipientId,
    actor,
    workspace,
    type,
    title,
    message,
    metadata,
  });

  const populatedNotification = await Notification.findById(
    notification._id
  )
    .populate("actor", "username avatar")
    .populate("workspace", "name");

  if (socketIO && populatedNotification) {
    try {
      const unreadCount = await getUnreadCount(recipientId);

      socketIO
        .to(`user:${recipientId}`)
        .emit("notification:new", {
          notification: populatedNotification,
          unreadCount,
        });
    } catch (error) {
     
      console.error(
        "Failed to emit new notification:",
        error.message
      );
    }
  }

  return populatedNotification;
};

const getNotifications = async ({
  userId,
  page = 1,
  limit = 20,
}) => {
  const recipientId = normalizeUserId(userId);

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(
    50,
    Math.max(1, Number(limit) || 20)
  );

  const filter = { recipient: recipientId };

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
  const recipientId = normalizeUserId(userId);

  return Notification.countDocuments({
    recipient: recipientId,
    readAt: null,
  });
};

const markNotificationAsRead = async ({
  notificationId,
  userId,
}) => {
  const recipientId = normalizeUserId(userId);

  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: recipientId,
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
  const recipientId = normalizeUserId(userId);

  const result = await Notification.updateMany(
    {
      recipient: recipientId,
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
  const recipientId = normalizeUserId(userId);

  return Notification.findOneAndDelete({
    _id: notificationId,
    recipient: recipientId,
  });
};

const clearNotifications = async (userId) => {
  const recipientId = normalizeUserId(userId);

  const result = await Notification.deleteMany({
    recipient: recipientId,
  });

  return result.deletedCount;
};

module.exports = {
  setSocketIO,
  createNotification,
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearNotifications,
};
