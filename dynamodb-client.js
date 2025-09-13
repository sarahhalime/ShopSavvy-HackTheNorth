import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

// Initialize DynamoDB client with environment variables
const client = new DynamoDBClient({ 
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get table name from environment variables
const tableName = process.env.DYNAMODB_TABLE_NAME || "Shopify-warehouse";

async function putItem() {
  try {
    console.log("Putting item into DynamoDB...");
    
    const putResult = await ddbDocClient.send(
      new PutCommand({
        TableName: tableName,
        Item: { 
          product_id: "PROD-125", 
          name: "Product A", 
          category: "Electronics", 
          price: 199.99 
        }
      })
    );
    
    console.log("Item successfully added:", putResult);
    return putResult;
  } catch (error) {
    console.error("Error putting item:", error);
    throw error;
  }
}

async function getItem() {
  try {
    console.log("Getting item from DynamoDB...");
    
    const result = await ddbDocClient.send(
      new GetCommand({ 
        TableName: tableName, 
        Key: { product_id: "PROD-125" } 
      })
    );
    
    console.log("Retrieved item:", result.Item);
    return result.Item;
  } catch (error) {
    console.error("Error getting item:", error);
    throw error;
  }
}

// Main function to run both operations
async function main() {
  try {
    console.log("=== DynamoDB Operations Demo ===");
    console.log(`Using table: ${tableName}`);
    console.log(`Region: us-east-1\n`);
    
    // Put an item
    await putItem();
    console.log(""); // Empty line for readability
    
    // Get the item
    await getItem();
    
    console.log("\n=== Operations completed successfully ===");
  } catch (error) {
    console.error("Main function error:", error);
    process.exit(1);
  }
}

// Run the main function
main();
