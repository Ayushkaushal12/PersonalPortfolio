const dbConnect = require("../_lib/dbConnect");
const Message = require("../_lib/Message");
const { deleteMessage } = require("../_lib/memoryStore");

module.exports = async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const hasDatabase = Boolean(process.env.MONGODB_URI);

    const { id } = req.query;

    if (hasDatabase) {
      await dbConnect();
      await Message.findByIdAndDelete(id);
    } else {
      deleteMessage(id);
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to delete message",
    });
  }
};
