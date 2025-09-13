import { DynamoDBClient, ListTablesCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const client = new DynamoDBClient({ 
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

async function checkTableInfo() {
  try {
    console.log("🔍 DEBUGGING DYNAMODB TABLE ISSUE\n");
    
    // 1. List all tables in your account
    console.log("1️⃣ Listing all DynamoDB tables in your account:");
    const listResult = await client.send(new ListTablesCommand({}));
    console.log("   Tables found:", listResult.TableNames);
    console.log("");
    
    // 2. Check the specific table we're using
    const tableName = process.env.DYNAMODB_TABLE_NAME || "Shopify-warehouse";
    console.log(`2️⃣ Checking table: ${tableName}`);
    
    try {
      const describeResult = await client.send(new DescribeTableCommand({
        TableName: tableName
      }));
      
      console.log("   ✅ Table exists!");
      console.log("   📊 Table info:");
      console.log(`      - Table Name: ${describeResult.Table.TableName}`);
      console.log(`      - Status: ${describeResult.Table.TableStatus}`);
      console.log(`      - Item Count: ${describeResult.Table.ItemCount}`);
      console.log(`      - Table Size: ${describeResult.Table.TableSizeBytes} bytes`);
      console.log(`      - Partition Key: ${describeResult.Table.KeySchema[0].AttributeName}`);
      console.log("");
      
    } catch (error) {
      console.log("   ❌ Table not found:", error.message);
      return;
    }
    
    // 3. Scan the table to see actual items
    console.log("3️⃣ Scanning table contents:");
    const scanResult = await ddbDocClient.send(new ScanCommand({
      TableName: tableName,
      Limit: 10
    }));
    
    console.log(`   📦 Found ${scanResult.Items?.length || 0} items:`);
    
    if (scanResult.Items && scanResult.Items.length > 0) {
      scanResult.Items.forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.product_id || item.product || 'NO-ID'} - ${item.name || 'NO-NAME'} - ${item.category || 'NO-CATEGORY'}`);
      });
    } else {
      console.log("      No items found in table");
    }
    
    console.log("");
    console.log("🎯 CONSOLE ACCESS INFO:");
    console.log(`   Region: ${process.env.AWS_DEFAULT_REGION || "us-east-1"}`);
    console.log(`   Table: ${tableName}`);
    console.log(`   Direct link: https://${process.env.AWS_DEFAULT_REGION || "us-east-1"}.console.aws.amazon.com/dynamodbv2/home?region=${process.env.AWS_DEFAULT_REGION || "us-east-1"}#table?name=${tableName}`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkTableInfo();
