// Demo data seeding script
const { MongoClient } = require("mongodb")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/shopsavvy"

const demoData = {
  users: [
    {
      auth0Id: "demo-user-1",
      solanaAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      profile: {
        tasteVectors: { electronics: 0.8, fashion: 0.3, home: 0.6 },
        preferences: { budget: "mid-range", style: "modern" },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  categoryRules: [
    {
      key: "electronics",
      includes: ["laptop", "phone", "headphones", "computer", "tech"],
      excludes: ["toy", "game"],
      budgetTag: "tech-budget",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      key: "fashion",
      includes: ["clothing", "shoes", "accessories", "apparel"],
      excludes: ["uniform"],
      budgetTag: "fashion-budget",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  featureFlags: [
    {
      key: "ethL2Receipts",
      enabled: false,
      description: "Enable Ethereum L2 receipt NFT minting",
      updatedAt: new Date(),
    },
    {
      key: "splCashback",
      enabled: true,
      description: "Enable SPL token cashback rewards",
      updatedAt: new Date(),
    },
  ],
}

async function seedDemo() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db()

    // Clear existing demo data
    await db.collection("users").deleteMany({ auth0Id: { $regex: /^demo-/ } })
    await db.collection("categoryrules").deleteMany({})
    await db.collection("featureflags").deleteMany({})

    // Insert demo data
    await db.collection("users").insertMany(demoData.users)
    await db.collection("categoryrules").insertMany(demoData.categoryRules)
    await db.collection("featureflags").insertMany(demoData.featureFlags)

    console.log("✅ Demo data seeded successfully!")
    console.log("- Users:", demoData.users.length)
    console.log("- Category Rules:", demoData.categoryRules.length)
    console.log("- Feature Flags:", demoData.featureFlags.length)
  } catch (error) {
    console.error("❌ Error seeding demo data:", error)
  } finally {
    await client.close()
  }
}

if (require.main === module) {
  seedDemo()
}

module.exports = { seedDemo, demoData }
