const dbConnect = require("../_lib/dbConnect");
const Message = require("../_lib/Message");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const messages = await Message.find().sort({ timestamp: -1 });

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
