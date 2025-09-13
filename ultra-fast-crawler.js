import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";
import { SHOPIFY_STORES as shopifyStores } from "./shopify-stores-list.js";

dotenv.config({ path: '.env.local' });

const dynamoClient = new DynamoDBClient({ 
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const tableName = process.env.DYNAMODB_TABLE_NAME || "Shopify-warehouse";

console.log(`🗄️  DynamoDB Table: ${tableName}`);
console.log(`🔧 AWS Region: ${process.env.AWS_DEFAULT_REGION || "us-east-1"}`);

// ULTRA-FAST CONFIGURATION - Maximum threading
const ULTRA_CONFIG = {
  MAX_CONCURRENT_STORES: 50,        // Process 50 stores simultaneously (increased)
  MAX_CONCURRENT_PRODUCTS: 15,      // 15 products per store concurrently (increased)
  PRODUCTS_PER_STORE: 10000,        // Up to 10000 products per store (Shopify API limit)
  AI_DELAY_MS: 100,                 // Faster AI calls - 100ms delay (reduced)
  STORE_DELAY_MS: 50,               // Minimal store delay (reduced)
  REQUEST_TIMEOUT: 30000,           // 30 second timeout
  RETRY_ATTEMPTS: 2,                // Quick retry
  BATCH_SIZE: 5,                    // Upload in batches of 5 (testing smaller batches)
  SKIP_AI: false,                   // Set to true to skip AI analysis for testing
};

console.log(`🚀 ULTRA-FAST MULTI-THREADED SHOPIFY CRAWLER`);
console.log(`⚡ Configuration: ${ULTRA_CONFIG.MAX_CONCURRENT_STORES} concurrent stores`);
console.log(`🔥 Each store: ${ULTRA_CONFIG.MAX_CONCURRENT_PRODUCTS} concurrent products`);
console.log(`📊 Total theoretical concurrency: ${ULTRA_CONFIG.MAX_CONCURRENT_STORES * ULTRA_CONFIG.MAX_CONCURRENT_PRODUCTS} parallel operations`);
console.log(`🎯 Target: ${shopifyStores.length} stores with up to ${ULTRA_CONFIG.PRODUCTS_PER_STORE} products each\n`);

// Statistics tracking
const stats = {
  storesProcessed: 0,
  storesSuccessful: 0,
  storesFailed: 0,
  productsProcessed: 0,
  productsUploaded: 0,
  productsFailed: 0,
  startTime: Date.now(),
  aiCallsCompleted: 0,
  uploadsCompleted: 0
};

// Progress tracking
let progressInterval;

function startProgressTracking() {
  progressInterval = setInterval(() => {
    const elapsed = (Date.now() - stats.startTime) / 1000;
    const storeRate = stats.storesProcessed / elapsed;
    const productRate = stats.productsProcessed / elapsed;
    
    console.log(`📈 PROGRESS: ${stats.storesProcessed}/${shopifyStores.length} stores | ${stats.productsUploaded} products uploaded | ${storeRate.toFixed(1)} stores/sec | ${productRate.toFixed(1)} products/sec`);
  }, 5000);
}

function stopProgressTracking() {
  if (progressInterval) {
    clearInterval(progressInterval);
  }
}

// Rate limiting for AI calls
class RateLimiter {
  constructor(callsPerMinute = 120) {
    this.callsPerMinute = callsPerMinute;
    this.calls = [];
  }

  async waitForSlot() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove calls older than 1 minute
    this.calls = this.calls.filter(time => time > oneMinuteAgo);
    
    if (this.calls.length >= this.callsPerMinute) {
      const oldestCall = Math.min(...this.calls);
      const waitTime = (oldestCall + 60000) - now + 100; // Add 100ms buffer
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.calls.push(now);
  }
}

const aiRateLimiter = new RateLimiter(60); // 60 calls per minute for GPT-4

// Fast AI analysis function
async function fastAIAnalysis(title, description, tags, vendor, productType) {
  await aiRateLimiter.waitForSlot();
  
  try {
    const prompt = `Analyze this product and return ONLY JSON with key attributes:

Product: ${title}
Description: ${(description || '').replace(/<[^>]*>/g, '').substring(0, 200)}
Tags: ${tags ? tags.join(', ') : ''}
Vendor: ${vendor || ''}

Return ONLY this JSON structure:
{
  "category": "main product category",
  "subcategory": "specific type", 
  "colors": ["primary", "secondary"],
  "materials": ["main materials"],
  "style": "style type",
  "activity": "main use",
  "gender": "target gender",
  "features": ["key features"],
  "search_terms": ["natural search keywords"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Switch to GPT-4.1 (turbo)
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 300
    });

    let content = response.choices[0].message.content.trim();
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/```/g, '');
    
    stats.aiCallsCompleted++;
    return JSON.parse(content);
    
  } catch (error) {
    console.error(`AI analysis failed: ${error.message}`);
    return getFastFallback(title, vendor);
  }
}

function getFastFallback(title, vendor) {
  return {
    category: "product",
    subcategory: "item",
    colors: [],
    materials: [],
    style: "standard",
    activity: "general",
    gender: "unisex", 
    features: [],
    search_terms: [title.toLowerCase()]
  };
}

// Process single product with validation
async function processProduct(product, storeUrl, storeName) {
  try {
    const firstVariant = product.variants?.[0] || {};
    const mainImage = product.images?.[0]?.src || null;
    const price = parseFloat(firstVariant.price || 0);
    const productUrl = `${storeUrl}/products/${product.handle}`;

    // STRICT VALIDATION - all required fields must exist
    if (!product.title || !mainImage || price <= 0 || !productUrl) {
      console.log(`   ⚠️  Skipping invalid product: title=${!!product.title}, image=${!!mainImage}, price=${price}, url=${!!productUrl}`);
      return null; // Skip invalid products
    }

    // AI analysis with delay and fallback
    let analysis;
    if (ULTRA_CONFIG.SKIP_AI) {
      console.log(`   🚀 Skipping AI analysis for: ${product.title}`);
      analysis = getFastFallback(product.title, product.vendor);
    } else {
      await new Promise(resolve => setTimeout(resolve, ULTRA_CONFIG.AI_DELAY_MS));
      try {
        analysis = await fastAIAnalysis(
          product.title,
          product.body_html,
          product.tags,
          product.vendor,
          product.product_type
        );
      } catch (error) {
        console.log(`   ⚠️  AI analysis failed, using fallback for: ${product.title}`);
        analysis = getFastFallback(product.title, product.vendor);
      }
    }

    const processedProduct = {
      product: `ULTRA_${product.id}_${Date.now()}`, // Ensure unique key
      name: product.title,
      price: price.toString(),
      image: mainImage,
      source_store: storeName,
      vendor: product.vendor || storeName,
      product_url: productUrl,
      
      // AI-analyzed attributes
      category: analysis.category,
      subcategory: analysis.subcategory,
      discovered_category: analysis.category,
      all_colors: analysis.colors,
      primary_color: analysis.colors[0] || 'unknown',
      secondary_colors: analysis.colors.slice(1),
      materials: analysis.materials,
      primary_material: analysis.materials[0] || 'unknown',
      style_category: analysis.style,
      activity: analysis.activity,
      primary_use: analysis.activity,
      target_gender: analysis.gender,
      gender: analysis.gender,
      special_features: analysis.features,
      functional_features: analysis.features,
      
      // Enhanced search text
      comprehensive_search: [
        product.title,
        analysis.category,
        analysis.subcategory,
        ...analysis.colors,
        ...analysis.materials,
        analysis.style,
        analysis.activity,
        ...analysis.search_terms
      ].filter(Boolean).join(' ').toLowerCase(),
      
      crawled_at: new Date().toISOString(),
      analysis_type: 'ultra_fast_ai',
      crawler_version: 'ultra-fast-v2.0'
    };

    stats.productsProcessed++;
    console.log(`   ✅ Processed product: ${product.title} - $${price}`);
    return processedProduct;
    
  } catch (error) {
    console.error(`   ❌ Product processing failed for "${product.title}": ${error.message}`);
    return null;
  }
}

// Batch upload to DynamoDB
async function batchUploadProducts(products) {
  const validProducts = products.filter(Boolean);
  if (validProducts.length === 0) {
    console.log(`   ⚠️  No valid products to upload`);
    return;
  }

  console.log(`   📤 Uploading batch of ${validProducts.length} products to DynamoDB...`);

  const uploadPromises = validProducts.map(async (product) => {
    try {
      console.log(`   🔄 Uploading: ${product.name} (ID: ${product.product}) to table: ${tableName}`);
      await ddbDocClient.send(new PutCommand({
        TableName: tableName,
        Item: product
      }));
      stats.productsUploaded++;
      stats.uploadsCompleted++;
      console.log(`   ✅ Successfully uploaded: ${product.name}`);
      return true;
    } catch (error) {
      console.error(`   ❌ Upload failed for ${product.name}: ${error.message}`);
      console.error(`   🔍 Error details:`, error);
      stats.productsFailed++;
      return false;
    }
  });

  const results = await Promise.allSettled(uploadPromises);
  const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  console.log(`   ✅ Successfully uploaded ${successful}/${validProducts.length} products`);
}

// Process single store with maximum concurrency
async function processStore(storeUrl, storeName) {
  try {
    console.log(`🏪 Starting: ${storeName}`);
    
    // Construct products URL with proper Shopify API format
    let productsUrl;
    if (storeUrl.includes('/products.json')) {
      // URL already has /products.json, just add or update limit parameter
      if (storeUrl.includes('?')) {
        // Already has query parameters, check if limit exists
        if (storeUrl.includes('limit=')) {
          productsUrl = storeUrl.replace(/limit=\d+/, `limit=${ULTRA_CONFIG.PRODUCTS_PER_STORE}`);
        } else {
          productsUrl = `${storeUrl}&limit=${ULTRA_CONFIG.PRODUCTS_PER_STORE}`;
        }
      } else {
        productsUrl = `${storeUrl}?limit=${ULTRA_CONFIG.PRODUCTS_PER_STORE}`;
      }
    } else {
      // URL doesn't have /products.json, add it
      productsUrl = `${storeUrl}/products.json?limit=${ULTRA_CONFIG.PRODUCTS_PER_STORE}`;
    }
    
    const response = await axios.get(productsUrl, {
      timeout: ULTRA_CONFIG.REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProductCrawler/1.0)'
      }
    });

    const products = response.data.products || [];
    if (products.length === 0) {
      console.log(`   ⚠️  No products found for ${storeName}`);
      return;
    }

    console.log(`   📦 Processing ${products.length} products from ${storeName}`);
    console.log(`   🔗 Fetched from URL: ${productsUrl}`);

    // Process products in concurrent batches
    const semaphore = new Array(ULTRA_CONFIG.MAX_CONCURRENT_PRODUCTS).fill(null);
    const productResults = [];

    for (let i = 0; i < products.length; i += ULTRA_CONFIG.MAX_CONCURRENT_PRODUCTS) {
      const batch = products.slice(i, i + ULTRA_CONFIG.MAX_CONCURRENT_PRODUCTS);
      
      const batchPromises = batch.map(product => 
        processProduct(product, storeUrl, storeName)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      const validResults = batchResults
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);
      
      productResults.push(...validResults);

      // Batch upload every 10 products
      if (productResults.length >= ULTRA_CONFIG.BATCH_SIZE) {
        await batchUploadProducts(productResults.splice(0, ULTRA_CONFIG.BATCH_SIZE));
      }
    }

    // Upload remaining products
    if (productResults.length > 0) {
      await batchUploadProducts(productResults);
    }

    stats.storesSuccessful++;
    console.log(`   ✅ Completed: ${storeName} (${products.length} products)`);
    
  } catch (error) {
    console.error(`❌ Store failed: ${storeName} - ${error.message}`);
    stats.storesFailed++;
  } finally {
    stats.storesProcessed++;
    
    // Small delay between stores
    await new Promise(resolve => setTimeout(resolve, ULTRA_CONFIG.STORE_DELAY_MS));
  }
}

// Main ultra-fast crawler function
async function ultraFastCrawl() {
  console.log(`🚀 STARTING ULTRA-FAST CRAWL OF ${shopifyStores.length} STORES\n`);
  
  startProgressTracking();
  
  try {
    // Process stores in concurrent batches
    for (let i = 0; i < shopifyStores.length; i += ULTRA_CONFIG.MAX_CONCURRENT_STORES) {
      const storeBatch = shopifyStores.slice(i, i + ULTRA_CONFIG.MAX_CONCURRENT_STORES);
      
      console.log(`\n🔄 Processing batch ${Math.floor(i / ULTRA_CONFIG.MAX_CONCURRENT_STORES) + 1}: ${storeBatch.length} stores concurrently`);
      
      const storePromises = storeBatch.map(store => 
        processStore(store.url, store.name)
      );
      
      await Promise.allSettled(storePromises);
      
      // Brief pause between batches to avoid overwhelming APIs
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } finally {
    stopProgressTracking();
    
    const totalTime = (Date.now() - stats.startTime) / 1000;
    const finalStoreRate = stats.storesProcessed / totalTime;
    const finalProductRate = stats.productsProcessed / totalTime;
    
    console.log(`\n🎉 ULTRA-FAST CRAWL COMPLETE!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(1)} seconds`);
    console.log(`🏪 Stores: ${stats.storesSuccessful}/${stats.storesProcessed} successful`);
    console.log(`📦 Products: ${stats.productsUploaded} uploaded, ${stats.productsFailed} failed`);
    console.log(`🤖 AI calls: ${stats.aiCallsCompleted} completed`);
    console.log(`📊 Performance: ${finalStoreRate.toFixed(2)} stores/sec, ${finalProductRate.toFixed(2)} products/sec`);
    console.log(`🎯 Concurrency: ${ULTRA_CONFIG.MAX_CONCURRENT_STORES}x${ULTRA_CONFIG.MAX_CONCURRENT_PRODUCTS} = ${ULTRA_CONFIG.MAX_CONCURRENT_STORES * ULTRA_CONFIG.MAX_CONCURRENT_PRODUCTS} parallel operations`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
}

// Run the ultra-fast crawler
ultraFastCrawl();
