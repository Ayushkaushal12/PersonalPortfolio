const nodemailer = require("nodemailer");
const dbConnect = require("./_lib/dbConnect");
const Message = require("./_lib/Message");
const { createMessage } = require("./_lib/memoryStore");

// Email regex for backend validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates a Nodemailer transporter from environment variables.
 * Returns null when SMTP credentials are not configured so the
 * handler can fall back to DB-only storage without crashing.
 */
function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for port 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { name, email, message } = req.body || {};

    // --- Backend validation ---
    if (!name || String(name).trim() === "") {
      return res.status(400).json({ success: false, error: "Name is required." });
    }

    if (!email || String(email).trim() === "") {
      return res.status(400).json({ success: false, error: "Email is required." });
    }

    if (!EMAIL_REGEX.test(String(email).trim())) {
      return res.status(400).json({ success: false, error: "Please enter a valid email address." });
    }

    if (!message || String(message).trim() === "") {
      return res.status(400).json({ success: false, error: "Message is required." });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanMessage = String(message).trim();

    // --- Store message (MongoDB or in-memory fallback) ---
    const hasDatabase = Boolean(process.env.MONGODB_URI);
    let created;

    if (hasDatabase) {
      await dbConnect();
      created = await Message.create({
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
      });
    } else {
      created = createMessage({
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
      });
    }

    // --- Send email via Nodemailer ---
    const transporter = createTransporter();
    const receiverEmail = process.env.RECEIVER_EMAIL;

    if (transporter && receiverEmail) {
      const mailOptions = {
        from: `"Portfolio Contact Form" <${process.env.SMTP_USER}>`,
        to: receiverEmail,
        replyTo: cleanEmail,
        subject: `New Portfolio Message from ${cleanName}`,
        text: [
          `Name:`,
          cleanName,
          ``,
          `Email:`,
          cleanEmail,
          ``,
          `Message:`,
          cleanMessage,
        ].join("\n"),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">
              New Portfolio Contact Message
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; width: 80px; vertical-align: top;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${cleanName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; vertical-align: top;">Email:</td>
                <td style="padding: 8px 0; color: #333;">
                  <a href="mailto:${cleanEmail}" style="color: #0066cc;">${cleanEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; vertical-align: top;">Message:</td>
                <td style="padding: 8px 0; color: #333; white-space: pre-line;">${cleanMessage}</td>
              </tr>
            </table>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
              Reply to this email to respond directly to ${cleanName}.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }
    // If SMTP is not configured, silently skip email — message is still stored.

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: created,
    });
  } catch (error) {
    // Never expose internal error details to the client
    console.error("Contact handler error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to send message. Please try again.",
    });
  }
};
