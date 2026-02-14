// MongoDB Replica Set Initialization Script
// Run this script to initialize the replica set and create admin user

// Configuration for replica set
rsconf = {
    _id: "rs0",
    version: 1,
    members: [
        {
            _id: 0,
            host: "mongo-primary:27017",
            priority: 2
        },
        {
            _id: 1,
            host: "mongo-secondary-1:27017",
            priority: 1
        },
        {
            _id: 2,
            host: "mongo-secondary-2:27017",
            priority: 1,
            arbiterOnly: false
        }
    ],
    settings: {
        electionTimeoutMillis: 10000,
        heartbeatTimeoutSecs: 10,
        catchUpTimeoutMillis: 60000,
        getLastErrorDefaults: {
            w: "majority",
            wtimeout: 15000
        }
    }
};

// Initialize replica set
try {
    print("Attempting to initialize replica set...");
    rs.initiate(rsconf);
    print("Replica set initiated successfully");
} catch (error) {
    print("Error initiating replica set:", error);
}

// Wait for replica set to initialize
sleep(10000);

// Check replica set status
try {
    const status = rs.status();
    print("Replica set status:", JSON.stringify(status, null, 2));
} catch (error) {
    print("Error getting replica set status:", error);
}

// Create admin user if it doesn't exist
db = db.getSiblingDB("admin");
try {
    db.createUser({
        user: "admin",
        pwd: "adminpassword",
        roles: [
            { role: "root", db: "admin" },
            { role: "clusterAdmin", db: "admin" },
            { role: "userAdminAnyDatabase", db: "admin" },
            { role: "dbAdminAnyDatabase", db: "admin" },
            { role: "readWriteAnyDatabase", db: "admin" }
        ]
    });
    print("Admin user created successfully");
} catch (error) {
    if (error.code === 51003) {
        print("Admin user already exists");
    } else {
        print("Error creating admin user:", error);
    }
}

// Print final configuration
print("Replica set initialization completed");
print("Current primary:", rs.isMaster().primary);
