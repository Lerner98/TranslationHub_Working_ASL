Current State of the MDB Server

# Structure:
mdb_server/
  ├── admin-service/
  │   ├── models/
  │   │   └── Admin.js
  │   ├── controllers/
  │   │   └── adminController.js
  │   ├── routes/
  │   │   └── adminRoutes.js
  │   ├── middleware/
  │   │   └── auth.js
  │   └── server.js
  ├── report-service/
  │   ├── models/
  │   │   └── Report.js
  │   ├── controllers/
  │   │   └── reportController.js
  │   ├── routes/
  │   │   └── reportRoutes.js
  │   ├── middleware/
  │   │   └── auth.js
  │   └── server.js
  ├── logs/
  │   ├── admins.json
  │   └── reports.json
  ├── .env
  ├── server.js



# Functionality:
Admin Microservice: CRUD operations for admins (POST /api/admins, GET /api/admins, etc.), login endpoint (POST /api/admins/login), Bcrypt for password encryption, token-based authentication.

# Report Microservice: 
CRUD operations for reports (POST /api/reports, GET /api/reports, etc.), statistics endpoints (GET /api/reports/statistics/errors-by-day, GET /api/reports/statistics/most-reported), token-based authentication for admin-only endpoints.

# MongoDB: 
Uses translationhub database with admins and reports collections.

# JSON Logging: 
Logs all operations to logs/admins.json and logs/reports.json.

# Authentication:
 Admins must log in to access protected endpoints; POST /api/reports is public for frontend submission.
Next Steps: Integrate with the client-side (errorBoundary) and React web dashboard.


# Comprehensive TODO List
📝 MDB Server Finalization and Testing
Goal: Ensure the mdb_server is fully functional, tested, and ready for integration with the frontend and web dashboard.


# 1. MongoDB Setup
 Create the translationhub database in MongoDB:
Run mongod to start MongoDB.
Connect to MongoDB: mongo.
Create the database: use translationhub.
Note: Collections (admins, reports) will be created automatically when data is inserted.


# 2. Environment Configuration
 Verify the .env file:
 MONGO_URI=mongodb://127.0.0.1:27017/translationhub

Add optional environment variables for future use (e.g., token expiration, logging level):
TOKEN_EXPIRY=3600  # Token expiry in seconds (1 hour)
LOG_LEVEL=info     # Logging level (info, debug, error)

# 3. Test API Endpoints with REST Client
Create a test directory in mdb_server:
mdb_server/test/

Create test/report.http for testing API endpoints:
### Create Admin (Admin Microservice)
POST http://localhost:3001/api/admins
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "securepassword"
}

### Login Admin (Admin Microservice)
POST http://localhost:3001/api/admins/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "securepassword"
}

### Create Error Report (Report Microservice, Public)
POST http://localhost:3002/api/reports
Content-Type: application/json

{
  "userId": "guest123",
  "type": "error",
  "message": "Test Error Report",
  "errorStack": "FakeStack:line 42",
  "screen": "HomePage",
  "deviceInfo": { "model": "iPhone 14", "os": "iOS 16" },
  "platform": "iOS",
  "appVersion": "1.0.0",
  "extra": {}
}

### Get All Error Reports (Report Microservice, Admin-Only)
GET http://localhost:3002/api/reports
Authorization: <token-from-login>

### Get Errors by Day (Report Microservice, Admin-Only)
GET http://localhost:3002/api/reports/statistics/errors-by-day
Authorization: <token-from-login>

### Get Most Reported Keywords (Report Microservice, Admin-Only)
GET http://localhost:3002/api/reports/statistics/most-reported
Authorization: <token-from-login>


 Install the REST Client extension in VSCode.
 Run the MDB server:

cd mdb_server
node server.js


Open test/report.http in VSCode and use the REST Client extension to send each request:
Verify the POST /api/admins request creates an admin (201 status).
Verify the POST /api/admins/login request returns a token (200 status).
Verify the POST /api/reports request saves a report (201 status).
Verify the GET /api/reports request returns reports (200 status, requires token).
Verify the statistics endpoints return data (200 status, requires token).
 Check MongoDB to ensure data is saved:
Connect to MongoDB: mongo.
Use the database: use translationhub.
Check collections: db.admins.find(), db.reports.find().


# 4. Validate Input for Report Submission
 Add input validation in report-service/controllers/reportController.js for submitReport:
Ensure optional fields (userId, errorStack, screen, deviceInfo, platform, appVersion, extra) are properly handled.

# Example (already included in the current submitReport, but verify):

if (!message) {
  return res.status(400).json({ success: false, message: 'Message is required' });
}

# Add validation for type to ensure it’s one of the allowed values (error, feedback, suggestion):

exports.submitReport = async (req, res) => {
  try {
    const { userId, type, message, errorStack, screen, deviceInfo, platform, appVersion, extra } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (type && !['error', 'feedback', 'suggestion'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type value' });
    }

    const report = new Report({ userId, type, message, errorStack, screen, deviceInfo, platform, appVersion, extra });
    await report.save();

    const reports = await readReportsFromJson();
    reports.push(report.toObject());
    await writeReportsToJson(reports);

    res.status(201).json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit report', error: error.message });
  }
};


# 5. Add Error Boundary Middleware (Optional)
Create report-service/middleware/errorBoundary.js to automatically handle errors and submit them as reports:

const Report = require('../models/Report');
const fs = require('fs').promises;
const path = require('path');

const REPORTS_JSON_PATH = path.join(__dirname, '../../logs/reports.json');

const readReportsFromJson = async () => {
  try {
    const data = await fs.readFile(REPORTS_JSON_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeReportsToJson = async (reports) => {
  await fs.writeFile(REPORTS_JSON_PATH, JSON.stringify(reports, null, 2));
};

const errorBoundary = async (err, req, res, next) => {
  try {
    const report = new Report({
      type: 'error',
      message: err.message || 'Unknown error',
      errorStack: err.stack || 'No stack trace',
      userId: req.adminId || 'system',
      screen: 'Unknown',
      deviceInfo: {},
      platform: 'Server',
      appVersion: '1.0.0',
      extra: { method: req.method, url: req.url }
    });
    await report.save();

    const reports = await readReportsFromJson();
    reports.push(report.toObject());
    await writeReportsToJson(reports);

    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to log error', error: error.message });
  }
};

module.exports = errorBoundary;


#  Add the middleware to report-service/server.js:

const express = require('express');
const mongoose = require('mongoose');
const reportRoutes = require('./routes/reportRoutes');
const errorBoundary = require('./middleware/errorBoundary');
require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(`${process.env.MONGO_URI}?dbName=translationhub-report`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB (Report Microservice)'))
  .catch((err) => {
    console.error('MongoDB connection error (Report Microservice):', err);
    process.exit(1);
  });

app.use('/api/reports', reportRoutes);
app.use(errorBoundary); // Add error boundary middleware

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Report Service running on port ${PORT}`);
});


# 📱 Frontend Integration (Client-Side)
Goal: Ensure the frontend (ErrorBoundary.jsx) can submit error reports to the mdb_server.

# 1. Update ErrorBoundary.jsx
Update componentDidCatch in ErrorBoundary.jsx to submit reports to the correct endpoint (POST http://localhost:3002/api/reports):


componentDidCatch(error, errorInfo) {
  console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
  this.setState({ toastVisible: true });

  fetch('http://localhost:3002/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: this.props.userId || 'guest',
      type: 'error',
      message: error?.message || 'Unknown error',
      errorStack: errorInfo?.componentStack || 'No stack info',
      screen: this.props.currentScreen || 'Unknown',
      deviceInfo: { model: 'Unknown', os: 'Unknown' },
      platform: 'Web',
      appVersion: '1.0.0',
      extra: {}
    })
  }).catch(err => {
    console.warn('❗ Failed to send error report:', err.message);
  });
}


# Add a utility function sendErrorReportToServer in a constants or utils file (e.g., Constants.js):

const API_URL = 'http://localhost:3002/api/reports';

export const sendErrorReportToServer = async (error, errorInfo, userId, currentScreen) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId || 'guest',
        type: 'error',
        message: error?.message || 'Unknown error',
        errorStack: errorInfo?.componentStack || 'No stack info',
        screen: currentScreen || 'Unknown',
        deviceInfo: { model: 'Unknown', os: 'Unknown' },
        platform: 'Web',
        appVersion: '1.0.0',
        extra: {}
      })
    });
    if (!response.ok) {
      throw new Error('Failed to send error report');
    }
  } catch (err) {
    console.warn('❗ Failed to send error report:', err.message);
  }
};

# Update ErrorBoundary.jsx to use the utility function

import { sendErrorReportToServer } from './Constants';

componentDidCatch(error, errorInfo) {
  console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
  this.setState({ toastVisible: true });

  sendErrorReportToServer(error, errorInfo, this.props.userId, this.props.currentScreen);
}

# Test the integration by forcing an error in the frontend (e.g., throw new Error('Test error') in a component) and verify the report is saved in MongoDB (db.reports.find()).
# 2. Add Constants for API URL
 Ensure Constants.js defines the API URL for the Report Microservice:

 export const API_URL = 'http://localhost:3002/api/reports';
export const ADMIN_API_URL = 'http://localhost:3001/api/admins';




