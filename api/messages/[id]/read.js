const dbConnect = require("../../_lib/dbConnect");
const Message = require("../../_lib/Message");
const { markRead } = require("../../_lib/memoryStore");

module.exports = async function handler(req, res) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const hasDatabase = Boolean(process.env.MONGODB_URI);

    const { id } = req.query;
    let message;

    if (hasDatabase) {
      await dbConnect();
      message = await Message.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true }
      );
    } else {
      message = markRead(id);
    }

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to update message",
    });
  }
};
