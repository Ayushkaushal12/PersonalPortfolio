const dbConnect = require("../../_lib/dbConnect");
const Message = require("../../_lib/Message");

module.exports = async function handler(req, res) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { id } = req.query;
    const message = await Message.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

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
