const dbConnect = require("./_lib/dbConnect");
const Message = require("./_lib/Message");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, error: "Please fill all required fields" });
    }

    const created = await Message.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      message: String(message).trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: created,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to send message. Please try again." });
  }
};
