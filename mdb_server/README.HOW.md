# Terminal 1: Start MongoDB Server
Type:

mongod --port 27017 --dbpath C:\data\db --auth


Note: Replace C:\data\db with your MongoDB data directory if it’s different. Ensure MongoDB is installed and the data directory exists before running this command. The --auth flag enables authentication, which is required for the database connection.

# Terminal 2: Populate the Database with Initial Data
Open the MongoDB shell and connect to the database with authentication:

Type:

mongosh mongodb://adminUser:adminPass123@127.0.0.1:27017/admin

Run the database setup script to create collections and insert initial data. Copy and paste the contents of final_proj_mdb.txt (inside README.dbSCRIPT) into the MongoDB shell. 

This script:
- Creates the translationhub database.
- Sets up collections: admins, reports, translationStats, userActivityStats, auditLogs.
- Inserts initial data, creates indexes, and performs various operations (e.g., updates, deletions, aggregations).


# Terminal 3: Start the MDB Server
Navigate to the MDB server directory:
cd C:\THNative\mdb_server

Install dependencies if you haven’t already:
npm install express mongoose dotenv cors jsonwebtoken winston winston-daily-rotate-file

Start the server:
node server.js

Expected Output:
2025-05-26 16:19:00 [INFO]: Connected to MongoDB
2025-05-26 16:19:00 [INFO]: MDB Server running on port 3001

Note: The MDB Server runs on port 3001 and provides the following endpoints:
- Admin routes: /admin (e.g., /admin/login, /admin/)
- Report routes: /api/reports (e.g., /api/reports/, /api/reports/statistics/*)


# Additional Notes for README

Access the API: Use a tool like Postman to test the API endpoints.

Login to Get a JWT Token:

POST http://localhost:3001/admin/login
Body:
{
"email": "guylerner12@gmail.com",
"password": "guy123"
}

# Expected Response: A JWT token in the response, along with admin details.

Get All Admins:

GET http://localhost:3001/admin
Headers: Authorization: Bearer <jwt_token>
# Expected Response: List of admins (Guy Lerner, Daniel Seth, Test User).

Get All Reports:
GET http://localhost:3001/api/reports
Headers: Authorization: Bearer <jwt_token>
# Expected Response: List of reports (after setup, should include reports for user123 and user456).


# Logs: The server logs HTTP requests and database operation errors to daily log files in the logs directory:

logs/access_<date>.log: HTTP request logs (e.g., 127.0.0.1 - 2025-05-26T16:19:00.123Z - POST - localhost:3001/admin/login - 200).
logs/access_DB_<date>.log: Database operation error logs (e.g., 2025-05-26 16:19:00 [ERROR]: submitReport - Failed to save report - data: {"body":{"userId":"user123","type":"error","message":"Test error"}}).

logs/server.log and logs/database.log: Server and database connection logs (e.g., 2025-05-26 16:19:00 [INFO]: Connected to MongoDB).</date></date>

Troubleshooting:
If MongoDB fails to start, ensure the data directory exists and MongoDB is installed.

If the server fails to start, verify all dependencies are installed and the MongoDB server is running.

If endpoints return errors, check the logs in the logs directory for details.