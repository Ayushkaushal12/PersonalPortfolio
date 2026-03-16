# Real-Time Message System Setup Guide

This portfolio now has a real-time messaging system with database storage. Follow these steps to set it up:

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

## Installation & Setup

### 1. Install Backend Dependencies
```bash
npm install
```

This will install:
- Express.js (backend framework)
- Mongoose (MongoDB ODM)
- CORS (cross-origin requests)
- Dotenv (environment variables)
- Concurrently (run server and React together)

### 2. MongoDB Setup

#### Option A: Local MongoDB (Recommended for Development)
1. Download and install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. The default connection string in `.env` is: `mongodb://localhost:27017/portfolio-messages`

#### Option B: MongoDB Atlas Cloud (Recommended for Deployment)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `.env` file:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio-messages
```

### 3. Start the Application

**Development Mode (Backend + Frontend):**
```bash
npm run dev
```

**Backend Only:**
```bash
npm run server
```

**Frontend Only:**
```bash
npm start
```

### 4. How It Works

- When a user submits the contact form, the message is saved to MongoDB
- Success message appears after submission
- Messages are stored permanently in the database

### 5. Admin Dashboard

View all messages at: `/admin` (add this route to your app to access the admin dashboard)

Features:
- View all messages in real-time
- Mark messages as read
- Delete messages
- Auto-refresh every 30 seconds

### 6. API Endpoints

- **POST /api/contact** - Submit a new message
- **GET /api/messages** - Get all messages
- **GET /api/messages/unread/count** - Get unread message count
- **PUT /api/messages/:id/read** - Mark message as read
- **DELETE /api/messages/:id** - Delete a message

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check your connection string in `.env`
- Verify network access (if using Atlas)

### CORS Error
- Ensure backend server is running on port 5000
- Check that frontend is making requests to `http://localhost:5000`

### Port Already in Use
- Change PORT in `.env` if 5000 is in use
- Update the API URL in contact component accordingly

## File Structure

```
react-portfolio-master/
├── server.js              # Backend Express server
├── .env                   # Environment variables
├── package.json           # Dependencies
└── react-portfolio-master/
    └── src/
        ├── pages/
        │   ├── contact/   # Updated contact form
        │   └── admin/     # Admin dashboard (optional)
        └── ...
```

## Next Steps

1. Start the backend: `npm run server`
2. In a new terminal, start the frontend: `npm start`
3. Test the contact form at `/contact`
4. Check messages in the database via MongoDB Compass or the admin dashboard

Enjoy your new real-time messaging system! 🎉
