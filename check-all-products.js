import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const dynamoClient = new DynamoDBClient({ 
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);
const tableName = process.env.DYNAMODB_TABLE_NAME || "Shopify-warehouse";

async function scanAllProducts() {
  try {
    console.log("🔍 SCANNING ALL PRODUCTS IN DYNAMODB");
    console.log("====================================\n");
    
    let allItems = [];
    let lastEvaluatedKey;
    let scanCount = 0;
    
    do {
      scanCount++;
      console.log(`📄 Scan page ${scanCount}...`);
      
      const scanParams = {
        TableName: tableName,
        Limit: 1000, // Scan 1000 items at a time
      };
      
      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }
      
      const result = await ddbDocClient.send(new ScanCommand(scanParams));
      
      if (result.Items) {
        allItems.push(...result.Items);
        console.log(`   Found ${result.Items.length} items (Total: ${allItems.length})`);
      }
      
      lastEvaluatedKey = result.LastEvaluatedKey;
      
    } while (lastEvaluatedKey);
    
    console.log(`\n📊 SCAN COMPLETE!`);
    console.log(`🎯 Total Products: ${allItems.length}`);
    
    // Group by store
    const storeGroups = {};
    allItems.forEach(item => {
      const store = item.source_store || item.vendor || 'Unknown';
      if (!storeGroups[store]) storeGroups[store] = [];
      storeGroups[store].push(item);
    });
    
    console.log(`\n🏪 PRODUCTS BY STORE:`);
    Object.entries(storeGroups)
      .sort(([,a], [,b]) => b.length - a.length)
      .forEach(([store, products]) => {
        console.log(`   ${store}: ${products.length} products`);
      });
    
    // Show some example products
    console.log(`\n🔍 SAMPLE PRODUCTS:`);
    allItems.slice(0, 10).forEach((item, i) => {
      const colors = item.all_colors?.length ? item.all_colors.slice(0,2).join(', ') : 'none';
      const category = item.category || 'unknown';
      console.log(`   ${i+1}. ${item.name?.substring(0, 40)}... - ${category} (${colors})`);
    });
    
    // Check analysis quality
    const dynamicAnalysis = allItems.filter(item => item.analysis_type === 'mass_dynamic_ai');
    const withColors = allItems.filter(item => item.all_colors?.length > 0);
    const withMaterials = allItems.filter(item => item.materials?.length > 0);
    
    console.log(`\n🧠 ANALYSIS QUALITY:`);
    console.log(`   Dynamic AI analysis: ${dynamicAnalysis.length}/${allItems.length} products`);
    console.log(`   Products with colors: ${withColors.length}/${allItems.length} products`);
    console.log(`   Products with materials: ${withMaterials.length}/${allItems.length} products`);
    
    return allItems;
    
  } catch (error) {
    console.error("❌ Error scanning products:", error.message);
  }
}

scanAllProducts();
