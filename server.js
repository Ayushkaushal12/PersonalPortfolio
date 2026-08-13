const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

// Email regex for backend validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates a Nodemailer transporter from environment variables.
 * Returns null when SMTP credentials are not configured.
 */
function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

/**
 * Sends a contact email to RECEIVER_EMAIL.
 * Silently skips if SMTP env vars are not configured.
 */
async function sendContactEmail({ name, email, message }) {
  const transporter = createTransporter();
  const receiverEmail = process.env.RECEIVER_EMAIL;
  if (!transporter || !receiverEmail) return;

  const mailOptions = {
    from: `"Portfolio Contact Form" <${process.env.SMTP_USER}>`,
    to: receiverEmail,
    replyTo: email,
    subject: `New Portfolio Message from ${name}`,
    text: [
      `Name:`,
      name,
      ``,
      `Email:`,
      email,
      ``,
      `Message:`,
      message,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">
          New Portfolio Contact Message
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555; width: 80px; vertical-align: top;">Name:</td>
            <td style="padding: 8px 0; color: #333;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555; vertical-align: top;">Email:</td>
            <td style="padding: 8px 0; color: #333;">
              <a href="mailto:${email}" style="color: #0066cc;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555; vertical-align: top;">Message:</td>
            <td style="padding: 8px 0; color: #333; white-space: pre-line;">${message}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 12px; color: #999;">
          Reply to this email to respond directly to ${name}.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB — connect only when MONGODB_URI is set.
// This prevents crashing the contact route when MongoDB is not running locally.
let Message = null;

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI, { bufferCommands: false })
    .then(() => {
      console.log("MongoDB connected successfully");

      // Define schema and model only after a successful connection
      const messageSchema = new mongoose.Schema({
        name:      { type: String, required: true },
        email:     { type: String, required: true },
        message:   { type: String, required: true },
        timestamp: { type: Date,   default: Date.now },
        isRead:    { type: Boolean, default: false },
      });

      Message = mongoose.models.Message || mongoose.model("Message", messageSchema);
    })
    .catch((err) => console.log("MongoDB connection error:", err));
} else {
  console.log("MONGODB_URI not set — running without database.");
}

// API Routes

// Send message
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

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

    // Save to database only when MongoDB is available
    if (Message) {
      const newMessage = new Message({
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
      });
      await newMessage.save();
    }

    // Send email notification
    await sendContactEmail({
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully!",
      data: newMessage,
    });
  } catch (error) {
    // Never expose internal error details to the client
    console.error("Contact route error:", error);
    res.status(500).json({
      success: false,
      error: "Unable to send message. Please try again.",
    });
  }
});

// Get all messages (for admin dashboard)
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 });
    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
    });
  }
});

// Get unread messages count
app.get("/api/messages/unread/count", async (req, res) => {
  try {
    const count = await Message.countDocuments({ isRead: false });
    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch unread count",
    });
  }
});

// Mark message as read
app.put("/api/messages/:id/read", async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update message",
    });
  }
});

// Delete message
app.delete("/api/messages/:id", async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete message",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
