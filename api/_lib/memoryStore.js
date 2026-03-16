const { randomUUID } = require("crypto");

if (!global._messageMemoryStore) {
  global._messageMemoryStore = [];
}

function getStore() {
  return global._messageMemoryStore;
}

function createMessage({ name, email, message }) {
  const item = {
    _id: randomUUID(),
    name,
    email,
    message,
    timestamp: new Date(),
    isRead: false,
  };

  getStore().unshift(item);
  return item;
}

function listMessages() {
  return getStore();
}

function markRead(id) {
  const item = getStore().find((msg) => msg._id === id);
  if (!item) {
    return null;
  }

  item.isRead = true;
  return item;
}

function deleteMessage(id) {
  const list = getStore();
  const idx = list.findIndex((msg) => msg._id === id);
  if (idx === -1) {
    return false;
  }

  list.splice(idx, 1);
  return true;
}

module.exports = {
  createMessage,
  listMessages,
  markRead,
  deleteMessage,
};
