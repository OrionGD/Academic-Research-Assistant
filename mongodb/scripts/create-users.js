// MongoDB User Creation and Management Script

// Connect to admin database
db = db.getSiblingDB("admin");

// Switch to ARAS database
db = db.getSiblingDB("aras");

// Create application user with specific privileges
try {
    db.createUser({
        user: "aras_app",
        pwd: "app_secure_password_2024",
        roles: [
            { role: "readWrite", db: "aras" },
            { role: "dbAdmin", db: "aras" }
        ],
        customData: {
            application: "ARAS",
            created: new Date(),
            description: "Application user for ARAS platform"
        }
    });
    print("Application user created successfully");
} catch (error) {
    if (error.code === 51003) {
        print("Application user already exists");
    } else {
        print("Error creating application user:", error);
    }
}

// Create read-only user for reporting
try {
    db.createUser({
        user: "aras_reader",
        pwd: "reader_secure_password_2024",
        roles: [
            { role: "read", db: "aras" }
        ],
        customData: {
            application: "ARAS",
            created: new Date(),
            description: "Read-only user for reporting"
        }
    });
    print("Read-only user created successfully");
} catch (error) {
    if (error.code === 51003) {
        print("Read-only user already exists");
    } else {
        print("Error creating read-only user:", error);
    }
}

// Create indexes for common queries
db = db.getSiblingDB("aras");

// Users collection indexes
db.createCollection("users");
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });
db.users.createIndex({ "status": 1 });

// Documents collection indexes
db.createCollection("documents");
db.documents.createIndex({ "userId": 1 });
db.documents.createIndex({ "createdAt": -1 });
db.documents.createIndex({ "status": 1 });
db.documents.createIndex({ "tags": 1 });
db.documents.createIndex({ "title": "text", "content": "text" });

// Sessions collection with TTL
db.createCollection("sessions");
db.sessions.createIndex({ "userId": 1 });
db.sessions.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 86400 }); // 24 hours TTL

print("Database initialization completed successfully");
print("Collections and indexes created");
