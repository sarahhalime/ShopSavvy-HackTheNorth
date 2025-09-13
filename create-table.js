import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const client = new DynamoDBClient({ 
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const tableName = process.env.DYNAMODB_TABLE_NAME || "Shopify-warehouse";

async function createTable() {
  try {
    // Check if table already exists
    try {
      await client.send(new DescribeTableCommand({ TableName: tableName }));
      console.log(`✅ Table '${tableName}' already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    console.log(`Creating DynamoDB table: ${tableName}`);
    
    const createTableParams = {
      TableName: tableName,
      KeySchema: [
        {
          AttributeName: 'product_id',
          KeyType: 'HASH' // Partition key
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'product_id',
          AttributeType: 'S'
        },
        {
          AttributeName: 'primary_category',
          AttributeType: 'S'
        },
        {
          AttributeName: 'source_website',
          AttributeType: 'S'
        },
        {
          AttributeName: 'price',
          AttributeType: 'N'
        }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'CategoryIndex',
          KeySchema: [
            {
              AttributeName: 'primary_category',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'price',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          BillingMode: 'PAY_PER_REQUEST'
        },
        {
          IndexName: 'WebsiteIndex',
          KeySchema: [
            {
              AttributeName: 'source_website',
              KeyType: 'HASH'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          BillingMode: 'PAY_PER_REQUEST'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST', // On-demand pricing
      Tags: [
        {
          Key: 'Project',
          Value: 'AI-Shopify-Crawler'
        },
        {
          Key: 'Environment',
          Value: 'Production'
        }
      ]
    };

    const result = await client.send(new CreateTableCommand(createTableParams));
    console.log(`✅ Table created successfully: ${tableName}`);
    console.log("Table ARN:", result.TableDescription.TableArn);
    console.log("⏳ Table is being created... This may take a few minutes.");
    
    // Wait for table to be active
    let tableStatus = 'CREATING';
    while (tableStatus !== 'ACTIVE') {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const describeResult = await client.send(new DescribeTableCommand({ TableName: tableName }));
      tableStatus = describeResult.Table.TableStatus;
      console.log(`Table status: ${tableStatus}`);
    }
    
    console.log(`🎉 Table '${tableName}' is now ACTIVE and ready to use!`);
    
  } catch (error) {
    console.error("Error creating table:", error);
    throw error;
  }
}

// Run the table creation
createTable().catch(console.error);
