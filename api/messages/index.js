const dbConnect = require("../_lib/dbConnect");
const Message = require("../_lib/Message");
const { listMessages } = require("../_lib/memoryStore");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const hasDatabase = Boolean(process.env.MONGODB_URI);
    let messages;

    if (hasDatabase) {
      await dbConnect();
      messages = await Message.find().sort({ timestamp: -1 });
    } else {
      messages = listMessages();
    }

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
    });
  }
};
