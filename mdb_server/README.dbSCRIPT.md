# Create the database

use translationhub

# Section 2: Database Setup
# Create the admins collection and insert data

db.admins.insertMany([
  {
    "name": "Guy Lerner",
    "email": "guylerner12@gmail.com",
    "password": "guy123",
    "roles": ["superadmin", "editor"],
    "permissions": { "canViewReports": true, "canDeleteAdmins": true },
    "reportIds": [],
    "createdAt": new Date(),
    "updatedAt": new Date()
  },
  {
    "name": "Daniel Seth",
    "email": "danielseth1840@gmail.com",
    "password": "daniel123",
    "roles": ["admin"],
    "permissions": { "canViewReports": true, "canDeleteAdmins": false },
    "reportIds": [],
    "createdAt": new Date(),
    "updatedAt": new Date()
  },
  {
    "name": "Test User",
    "email": "testuser@gmail.com",
    "password": "test123",
    "roles": ["viewer"],
    "permissions": { "canViewReports": false, "canDeleteAdmins": false },
    "reportIds": [],
    "createdAt": new Date(),
    "updatedAt": new Date()
  }
])

# Create the reports collection and insert data (Android-only)

db.reports.insertMany([
  {
    "userId": "user123",
    "type": "error",
    "message": "Network timeout",
    "errorStack": "Error: Network timeout at fetchData (/app.js:10)",
    "screen": "HomeScreen",
    "platform": "Android",
    "appVersion": 1.0,
    "deviceInfo": [
      { "os": "Android 14", "model": "Samsung Galaxy S23" },
      { "os": "Android 13", "model": "Google Pixel 7" }
    ],
    "actions": ["logged", "notified"],
    "relatedReports": [],
    "createdAt": new Date(),
    "updatedAt": new Date()
  },
  {
    "userId": "user456",
    "type": "crash",
    "message": "App crashed on login",
    "errorStack": "Error: Null pointer at login (/login.js:5)",
    "screen": "LoginScreen",
    "platform": "Android",
    "appVersion": 1.01,
    "deviceInfo": [{ "os": "Android 12", "model": "Samsung Galaxy S21" }],
    "actions": ["logged"],
    "relatedReports": [],
    "createdAt": new Date(),
    "updatedAt": new Date()
  },
  {
    "userId": "user789",
    "type": "feedback",
    "message": "UI is not intuitive",
    "screen": "SettingsScreen",
    "platform": "Android",
    "appVersion": 2.0,
    "deviceInfo": [{ "os": "Android 11", "model": "OnePlus 9" }],
    "actions": ["logged", "reviewed"],
    "relatedReports": [],
    "createdAt": new Date(),
    "updatedAt": new Date()
  }
])

# Update admin with report IDs

db.admins.updateOne(
  { "email": "guylerner12@gmail.com" },
  { $push: { "reportIds": db.reports.findOne({ "userId": "user123" })._id } }
)
db.admins.updateOne(
  { "email": "danielseth1840@gmail.com" },
  { $push: { "reportIds": db.reports.findOne({ "userId": "user456" })._id } }
)

# Update report with related report IDs

db.reports.updateOne(
  { "userId": "user456" },
  { $push: { "relatedReports": db.reports.findOne({ "userId": "user789" })._id } }
)

# Create the translationStats collection and insert data (fetched from MSSQL LanguageStatistics)

db.translationStats.insertMany([
  {
    "userId": "user123",
    "fromLang": "en",
    "toLang": "es",
    "translationCount": 10,
    "lastUpdated": new Date("2025-05-19T09:00:00Z")
  },
  {
    "userId": "user123",
    "fromLang": "en",
    "toLang": "fr",
    "translationCount": 5,
    "lastUpdated": new Date("2025-05-18T15:00:00Z")
  },
  {
    "userId": "user456",
    "fromLang": "en",
    "toLang": "de",
    "translationCount": 8,
    "lastUpdated": new Date("2025-05-19T08:00:00Z")
  }
])

# Create the userActivityStats collection and insert data (computed from MSSQL TextTranslations, VoiceTranslations, Sessions)

db.userActivityStats.insertMany([
  {
    "userId": "user123",
    "textTranslationCount": 15,
    "voiceTranslationCount": 5,
    "sessionCount": 20,
    "lastActive": new Date("2025-05-19T09:00:00Z"),
    "computedAt": new Date()
  },
  {
    "userId": "user456",
    "textTranslationCount": 10,
    "voiceTranslationCount": 3,
    "sessionCount": 15,
    "lastActive": new Date("2025-05-19T08:00:00Z"),
    "computedAt": new Date()
  },
  {
    "userId": "user789",
    "textTranslationCount": 8,
    "voiceTranslationCount": 2,
    "sessionCount": 10,
    "lastActive": new Date("2025-05-18T15:00:00Z"),
    "computedAt": new Date()
  }
])

# Create the auditLogs collection and insert data (fetched from MSSQL AuditLogs)

db.auditLogs.insertMany([
  {
    "logId": "log1",
    "userId": "user123",
    "action": "INSERT",
    "tableName": "TextTranslations",
    "recordId": "trans1",
    "actionDate": new Date("2025-05-19T09:00:00Z"),
    "details": "Text translation saved"
  },
  {
    "logId": "log2",
    "userId": "user456",
    "action": "UPDATE",
    "tableName": "Users",
    "recordId": "user456",
    "actionDate": new Date("2025-05-19T08:00:00Z"),
    "details": "User logged in"
  },
  {
    "logId": "log3",
    "userId": "user789",
    "action": "DELETE",
    "tableName": "VoiceTranslations",
    "recordId": "trans2",
    "actionDate": new Date("2025-05-18T15:00:00Z"),
    "details": "Voice translation deleted"
  }
])

# Create indexes for performance

db.reports.createIndex({ "userId": 1, "createdAt": -1 })
db.translationStats.createIndex({ "userId": 1, "fromLang": 1, "toLang": 1 })
db.userActivityStats.createIndex({ "userId": 1, "lastActive": -1 })
db.auditLogs.createIndex({ "userId": 1, "actionDate": -1 })

# Section 3: Writing JSON Code

var findReportsByUser = function(userId) {
  return db.reports.find({ "userId": userId }).toArray();
}
findReportsByUser("user123")

var updateAdminRole = function(email, newRole) {
  db.admins.updateOne(
    { "email": email },
    { $push: { "roles": newRole } }
  )
}
updateAdminRole("testuser@gmail.com", "editor")

var findAdminsByPermission = function(permissionKey, permissionValue) {
  return db.admins.find({ ["permissions." + permissionKey]: permissionValue }).toArray()
}
findAdminsByPermission("canDeleteAdmins", true)

var getPopularLanguagePairs = function() {
  return db.translationStats.aggregate([
    { $group: { "_id": { "fromLang": "$fromLang", "toLang": "$toLang" }, "totalTranslations": { $sum: "$translationCount" } } },
    { $sort: { "totalTranslations": -1 } },
    { $limit: 3 },
    { $project: { "fromLang": "$_id.fromLang", "toLang": "$_id.toLang", "totalTranslations": 1, "_id": 0 } }
  ]).toArray()
}
getPopularLanguagePairs()

# Section 4: Data Retrieval


db.admins.find(
  { "roles": "superadmin" },
  { "name": 1, "email": 1, "_id": 0 }
)

db.reports.find(
  {},
  { "message": 1, "platform": 1, "_id": 0 }
).sort({ "createdAt": -1 }).skip(1).limit(1)

db.reports.count({ "platform": "Android" })

db.reports.find(
  { "actions": { $elemMatch: { $eq: "reviewed" } } },
  { "message": 1, "actions": 1, "_id": 0 }
)

db.reports.find(
  { "deviceInfo": { $elemMatch: { "os": "Android 14" } } },
  { "message": 1, "deviceInfo": 1, "_id": 0 }
)

var report = db.reports.findOne({ "userId": "user456" })
db.reports.find(
  { "_id": { $in: report.relatedReports } },
  { "message": 1, "type": 1, "_id": 0 }
)

db.auditLogs.find(
  { "userId": "user123" },
  { "action": 1, "tableName": 1, "details": 1, "_id": 0 }
).sort({ "actionDate": -1 }).limit(5)

db.reports.find().forEach(function(doc) {
  print("Report from " + doc.platform + ": " + doc.message)
})

# Section 5: Updates and Deletions

db.reports.aggregate([
  { $match: { "deviceInfo.model": "Samsung Galaxy S23" } },
  { $out: "reports_samsung_backup" }
])

db.reports.deleteMany({ "type": "feedback" })

db.reports.updateOne(
  { "userId": "user123" },
  { $set: { "message": "Resolved network timeout" } }
)

db.reports.updateOne(
  { "userId": "user123" },
  { $addToSet: { "actions": "closed" } }
)

db.reports.updateOne(
  { "userId": "user123" },
  { $pull: { "actions": "logged" } }
)

db.reports.updateOne(
  { "userId": "user123" },
  { $inc: { "appVersion": 1 } }
)

db.reports.updateOne(
  { "userId": "user123" },
  { $push: { "actions": { $each: ["escalated", "resolved"], $slice: -3 } } }
)

db.admins.updateMany(
  { "roles": "viewer" },
  { $set: { "permissions.canViewReports": true } }
)

db.userActivityStats.updateOne(
  { "userId": "user123" },
  { $inc: { "sessionCount": 1 }, $set: { "lastActive": new Date(), "computedAt": new Date() } }
)

db.reports_samsung_backup.renameCollection("reports_samsung_archive")

db.reports_samsung_archive.drop()

# Section 6: Aggregated Results with aggregate

db.reports.aggregate([
  { $match: { "type": { $exists: true } } },
  { $group: { "_id": "$type", "count": { $sum: 1 } } },
  { $sort: { "count": -1 } },
  { $project: { "type": "$_id", "count": 1, "_id": 0 } }
])

db.reports.aggregate([
  { $match: { "createdAt": { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) } } },
  { $group: { "_id": { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, "count": { $sum: 1 } } },
  { $sort: { "_id": 1 } },
  { $project: { "date": "$_id", "count": 1, "_id": 0 } }
])

db.reports.aggregate([
  { $match: { "createdAt": { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } },
  { $unwind: "$deviceInfo" },
  { $group: {
      "_id": {
        "model": "$deviceInfo.model",
        "date": { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
      },
      "count": { $sum: 1 }
    }
  },
  { $group: {
      "_id": "$_id.model",
      "avgReportsPerDay": { $avg: "$count" }
    }
  },
  { $project: { "model": "$_id", "avgReportsPerDay": 1, "_id": 0 } }
])

db.admins.aggregate([
  { $match: { "roles": "admin" } },
  { $lookup: {
      "from": "reports",
      "localField": "reportIds",
      "foreignField": "_id",
      "as": "reports"
    }
  },
  { $unwind: "$reports" },
  { $match: { "reports.platform": "Android", "reports.deviceInfo.model": "Samsung Galaxy S21" } },
  { $project: { "name": 1, "reports.message": 1, "_id": 0 } },
  { $sort: { "name": 1 } }
])

db.translationStats.aggregate([
  { $group: { "_id": "$userId", "totalTranslations": { $sum: "$translationCount" } } },
  { $sort: { "totalTranslations": -1 } },
  { $limit: 5 },
  { $project: { "userId": "$_id", "totalTranslations": 1, "_id": 0 } }
])

# Section 7: Mapped and Reduced Results with mapReduce
db.reports.mapReduce(
  function() {
    this.deviceInfo.forEach(function(device) {
      emit(device.model, 1);
    });
  },
  function(key, values) {
    return Array.sum(values);
  },
  {
    "out": "reports_by_model",
    "query": { "platform": "Android" }
  }
)

db.reports_by_model.find()

db.auditLogs.mapReduce(
  function() {
    emit({ userId: this.userId, action: this.action }, 1);
  },
  function(key, values) {
    return Array.sum(values);
  },
  {
    "out": "audit_actions_by_user",
    "query": { "action": { $exists: true } }
  }
)

db.audit_actions_by_user.find()