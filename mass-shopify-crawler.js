import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";
import { Worker } from 'worker_threads';
import { SHOPIFY_STORES } from './shopify-stores-list.js';
import fs from 'fs/promises';

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

// Configuration - OPTIMIZED FOR GPT-4 RATE LIMITS  
const CONFIG = {
  MAX_CONCURRENT_STORES: 2,    // Much reduced for GPT-4 10K TPM limit
  MAX_PRODUCTS_PER_STORE: 100, // Manageable amount
  DELAY_BETWEEN_REQUESTS: 2000, // 2 second delay
  DELAY_BETWEEN_AI_CALLS: 15000, // 15 seconds for GPT-4 rate limits (CRITICAL)
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 60000, // 60 seconds 
  MAX_CONCURRENT_PRODUCTS: 1   // Only 1 concurrent for GPT-4 TPM limits
};

class MassShopifyCrawler {
  constructor() {
    this.processedStores = new Set();
    this.failedStores = new Set();
    this.totalProductsProcessed = 0;
    this.startTime = Date.now();
    this.progressFile = 'crawl-progress.json';
  }

  async loadProgress() {
    try {
      const data = await fs.readFile(this.progressFile, 'utf8');
      const progress = JSON.parse(data);
      this.processedStores = new Set(progress.processedStores || []);
      this.failedStores = new Set(progress.failedStores || []);
      this.totalProductsProcessed = progress.totalProductsProcessed || 0;
      console.log(`📂 Loaded progress: ${this.processedStores.size} stores done, ${this.totalProductsProcessed} products processed`);
    } catch (error) {
      console.log('📝 Starting fresh crawl - no progress file found');
    }
  }

  async saveProgress() {
    const progress = {
      processedStores: Array.from(this.processedStores),
      failedStores: Array.from(this.failedStores),
      totalProductsProcessed: this.totalProductsProcessed,
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(this.progressFile, JSON.stringify(progress, null, 2));
  }

  async dynamicProductAnalysis(title, description, tags, vendor, productType) {
    try {
      const prompt = `
You are an expert product analyst. Analyze this product and extract EVERY detail dynamically. DO NOT use predefined categories - discover and identify all attributes naturally from the product information.

Product Information:
- Title: ${title}
- Description: ${description || 'No description'}
- Tags: ${tags ? tags.join(', ') : 'No tags'}
- Vendor: ${vendor || 'Unknown'}
- Product Type: ${productType || 'Unknown'}

Analyze this product and return ONLY a clean JSON object:

{
  "discovered_category": "what type of product this actually is",
  "specific_subcategory": "more specific classification",
  "color_analysis": {
    "all_colors_mentioned": ["every color you find"],
    "primary_color": "main color if clear",
    "secondary_colors": ["accent colors"]
  },
  "material_discovery": {
    "materials_found": ["any materials mentioned"],
    "fabric_type": "specific fabric if mentioned",
    "special_technologies": ["tech features"]
  },
  "design_features": {
    "structural_elements": ["pockets, hoods, collars found"],
    "functional_features": ["zippers, velcro, drawstrings"],
    "style_characteristics": ["slim, oversized, cropped"]
  },
  "intended_use": {
    "primary_purpose": "main use",
    "activities_suitable_for": ["activities it's for"],
    "season_appropriateness": ["seasons"],
    "occasion_suitability": ["casual, formal, athletic"]
  },
  "target_demographics": {
    "gender_targeting": "who it's for",
    "age_group": "age demographic",
    "lifestyle_targeting": "lifestyle"
  },
  "search_intelligence": {
    "natural_search_terms": ["terms people would use to find this"],
    "descriptive_keywords": ["descriptive words"],
    "detailed_description": "comprehensive description"
  }
}

IMPORTANT: Only include what you can determine from the information provided. Use "unknown" or null for uncertain details.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1200
      });

      let content = response.choices[0].message.content.trim();
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/```/g, '');
      
      return JSON.parse(content);
      
    } catch (error) {
      console.error("AI analysis failed:", error.message);
      return this.getMinimalFallback(title, vendor);
    }
  }

  getMinimalFallback(title, vendor) {
    return {
      discovered_category: "product",
      specific_subcategory: "item",
      color_analysis: {
        all_colors_mentioned: [],
        primary_color: "unknown",
        secondary_colors: []
      },
      material_discovery: {
        materials_found: [],
        fabric_type: "unknown",
        special_technologies: []
      },
      design_features: {
        structural_elements: [],
        functional_features: [],
        style_characteristics: []
      },
      intended_use: {
        primary_purpose: "general use",
        activities_suitable_for: ["general"],
        season_appropriateness: ["all seasons"],
        occasion_suitability: ["casual"]
      },
      target_demographics: {
        gender_targeting: "unisex",
        age_group: "adult",
        lifestyle_targeting: "general"
      },
      search_intelligence: {
        natural_search_terms: [title.toLowerCase()],
        descriptive_keywords: [title.toLowerCase()],
        detailed_description: title
      }
    };
  }

  async fetchStoreProducts(store, maxProducts = CONFIG.MAX_PRODUCTS_PER_STORE) {
    try {
      console.log(`\n🏪 FETCHING: ${store.name}`);
      console.log(`   🔗 URL: ${store.url}?limit=${maxProducts}&page=1`);
      
      const response = await axios.get(`${store.url}?limit=${maxProducts}&page=1`, {
        timeout: CONFIG.TIMEOUT,
        headers: {
          'User-Agent': 'AI-Warehouse-Crawler/1.0',
          'Accept': 'application/json'
        }
      });
      
      const products = response.data.products || [];
      console.log(`   📦 Found ${products.length} products`);
      return products;
      
    } catch (error) {
      console.error(`   ❌ Failed to fetch ${store.name}: ${error.message}`);
      throw error;
    }
  }

  async processProduct(product, storeName, storeWebsite) {
    try {
      // Get pricing and images FIRST for validation
      const firstVariant = product.variants?.[0] || {};
      const mainImage = product.images?.[0]?.src || null;
      const price = parseFloat(firstVariant.price || 0);
      const productUrl = product.handle ? `${storeWebsite}/products/${product.handle}` : storeWebsite;
      
      // VALIDATION: Check if ALL required fields are present
      if (!mainImage) {
        console.log(`     ⏭️  SKIPPED (no image): ${product.title.substring(0, 40)}...`);
        return false;
      }
      
      if (!price || price <= 0) {
        console.log(`     ⏭️  SKIPPED (no price): ${product.title.substring(0, 40)}...`);
        return false;
      }
      
      if (!productUrl || productUrl === storeWebsite) {
        console.log(`     ⏭️  SKIPPED (no product link): ${product.title.substring(0, 40)}...`);
        return false;
      }
      
      if (!product.title || product.title.trim() === '') {
        console.log(`     ⏭️  SKIPPED (no title): ${product.id}`);
        return false;
      }
      
      // Only proceed with AI analysis if all required fields are present
      console.log(`     ✅ VALIDATED: ${product.title.substring(0, 40)}... (has all required fields)`);
      
      // Dynamic AI analysis
      const analysis = await this.dynamicProductAnalysis(
        product.title,
        product.body_html,
        product.tags,
        product.vendor,
        product.product_type
      );
      
      // Create comprehensive product object with VALIDATED required fields
      const processedProduct = {
        // REQUIRED FIELDS (already validated above)
        product: `${storeName.toUpperCase()}_${product.id}`,  // Changed to 'product' to match table schema
        name: product.title,                    // REQUIRED: Product name
        price: price,                          // REQUIRED: Valid price > 0  
        image: mainImage,                      // REQUIRED: Image URL
        product_url: productUrl,               // REQUIRED: Store product link
        source_store: storeName,               // REQUIRED: Store name
        
        // Additional fields
        vendor: product.vendor || storeName,
        
        // DYNAMIC AI CATEGORIZATION
        category: analysis.discovered_category,
        subcategory: analysis.specific_subcategory,
        
        // DYNAMIC COLORS
        all_colors: analysis.color_analysis.all_colors_mentioned,
        primary_color: analysis.color_analysis.primary_color,
        secondary_colors: analysis.color_analysis.secondary_colors,
        
        // DYNAMIC MATERIALS
        materials: analysis.material_discovery.materials_found,
        fabric_type: analysis.material_discovery.fabric_type,
        technologies: analysis.material_discovery.special_technologies,
        
        // DYNAMIC FEATURES
        structural_features: analysis.design_features.structural_elements,
        functional_features: analysis.design_features.functional_features,
        style_features: analysis.design_features.style_characteristics,
        
        // DYNAMIC USE CASES
        primary_use: analysis.intended_use.primary_purpose,
        activities: analysis.intended_use.activities_suitable_for,
        seasons: analysis.intended_use.season_appropriateness,
        occasions: analysis.intended_use.occasion_suitability,
        
        // DYNAMIC TARGETING
        target_gender: analysis.target_demographics.gender_targeting,
        target_age: analysis.target_demographics.age_group,
        lifestyle: analysis.target_demographics.lifestyle_targeting,
        
        // DYNAMIC SEARCH TERMS
        search_terms: analysis.search_intelligence.natural_search_terms,
        keywords: analysis.search_intelligence.descriptive_keywords,
        description: analysis.search_intelligence.detailed_description,
        
        // COMPREHENSIVE SEARCH TEXT
        searchable_content: [
          product.title,
          analysis.discovered_category,
          analysis.specific_subcategory,
          ...analysis.color_analysis.all_colors_mentioned,
          ...analysis.material_discovery.materials_found,
          ...analysis.design_features.structural_elements,
          ...analysis.intended_use.activities_suitable_for,
          ...analysis.search_intelligence.natural_search_terms,
          storeName
        ].filter(item => item && item !== 'unknown' && item !== null).join(' ').toLowerCase(),
        
        // Metadata
        crawled_at: new Date().toISOString(),
        analysis_type: 'mass_dynamic_ai'
      };
      
      // FINAL VALIDATION before DynamoDB upload
      const requiredFields = ['name', 'price', 'image', 'product_url', 'source_store'];
      const missingFields = requiredFields.filter(field => !processedProduct[field]);
      
      if (missingFields.length > 0) {
        console.log(`     ❌ FINAL VALIDATION FAILED - Missing: ${missingFields.join(', ')}`);
        return false;
      }
      
      // Upload to DynamoDB only if ALL validations pass
      await ddbDocClient.send(new PutCommand({
        TableName: tableName,
        Item: processedProduct
      }));
      
      console.log(`     ✅ UPLOADED TO DYNAMODB:`);
      console.log(`        📦 Name: ${processedProduct.name.substring(0, 35)}...`);
      console.log(`        💰 Price: $${processedProduct.price}`);
      console.log(`        🖼️  Image: ✅ Available`);
      console.log(`        🔗 Store Link: ✅ Available`);
      console.log(`        🏪 Store: ${processedProduct.source_store}`);
      console.log(`        🎨 Colors: ${analysis.color_analysis.all_colors_mentioned.slice(0,2).join(', ') || 'none'}`);
      console.log(`        📊 Category: ${analysis.discovered_category}`);
      console.log("");
      
      return true;
      
    } catch (error) {
      console.error(`     ❌ Failed to process ${product.title}: ${error.message}`);
      return false;
    }
  }

  async processStore(store) {
    if (this.processedStores.has(store.name)) {
      console.log(`⏭️  SKIPPING ${store.name} (already processed)`);
      return;
    }

    try {
      const products = await this.fetchStoreProducts(store);
      
      if (products.length === 0) {
        console.log(`   📭 No products found for ${store.name}`);
        this.processedStores.add(store.name);
        return;
      }

      console.log(`   🧠 Starting CONCURRENT AI analysis for ${products.length} products...`);
      console.log(`   ⚡ Using ${CONFIG.MAX_CONCURRENT_PRODUCTS} concurrent threads per store`);
      
      let successCount = 0;
      
      // Process products in concurrent batches
      for (let i = 0; i < products.length; i += CONFIG.MAX_CONCURRENT_PRODUCTS) {
        const batch = products.slice(i, i + CONFIG.MAX_CONCURRENT_PRODUCTS);
        
        console.log(`   🔬 Processing batch ${Math.floor(i / CONFIG.MAX_CONCURRENT_PRODUCTS) + 1}: ${batch.length} products`);
        
        // Process batch concurrently
        const batchPromises = batch.map(async (product, batchIndex) => {
          const globalIndex = i + batchIndex + 1;
          console.log(`      🧠 AI Analysis ${globalIndex}/${products.length}: ${product.title.substring(0, 35)}...`);
          
          const success = await this.processProduct(product, store.name, store.website);
          if (success) {
            this.totalProductsProcessed++;
            return 1;
          }
          return 0;
        });
        
        // Wait for batch to complete
        const batchResults = await Promise.allSettled(batchPromises);
        const batchSuccessCount = batchResults
          .filter(result => result.status === 'fulfilled')
          .reduce((sum, result) => sum + result.value, 0);
        
        successCount += batchSuccessCount;
        
        const skippedCount = batch.length - batchSuccessCount;
        console.log(`      ✅ Batch complete: ${batchSuccessCount}/${batch.length} uploaded to DynamoDB`);
        if (skippedCount > 0) {
          console.log(`      ⏭️  Skipped: ${skippedCount} (missing required fields)`);
        }
        
        // Brief pause between batches for rate limiting
        if (i + CONFIG.MAX_CONCURRENT_PRODUCTS < products.length) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_AI_CALLS));
        }
      }
      
      console.log(`   🎉 COMPLETED ${store.name}: ${successCount}/${products.length} products processed`);
      this.processedStores.add(store.name);
      
    } catch (error) {
      console.error(`   💥 STORE FAILED ${store.name}: ${error.message}`);
      this.failedStores.add(store.name);
    }
    
    await this.saveProgress();
  }

  async crawlAllStores() {
    console.log("🚀 MASS SHOPIFY CRAWLER - MAXIMUM THREADING");
    console.log("==============================================");
    console.log(`📊 Total stores: ${SHOPIFY_STORES.length}`);
    console.log(`⚡ Concurrent stores: ${CONFIG.MAX_CONCURRENT_STORES} (OPTIMIZED)`);
    console.log(`🔥 Products per store: ${CONFIG.MAX_PRODUCTS_PER_STORE}`);
    console.log(`🧵 Concurrent products: ${CONFIG.MAX_CONCURRENT_PRODUCTS} per store`);
    console.log(`🧠 AI Model: GPT-4 (premium dynamic analysis)`);
    console.log(`🎯 Expected total: ~${SHOPIFY_STORES.length * CONFIG.MAX_PRODUCTS_PER_STORE} products`);
    console.log("==============================================\n");

    await this.loadProgress();
    
    // Filter out already processed stores
    const remainingStores = SHOPIFY_STORES.filter(store => 
      !this.processedStores.has(store.name) && !this.failedStores.has(store.name)
    );
    
    console.log(`📋 Remaining stores to process: ${remainingStores.length}`);
    
    // Process stores in batches
    for (let i = 0; i < remainingStores.length; i += CONFIG.MAX_CONCURRENT_STORES) {
      const batch = remainingStores.slice(i, i + CONFIG.MAX_CONCURRENT_STORES);
      
      console.log(`\n🔄 PROCESSING BATCH ${Math.floor(i / CONFIG.MAX_CONCURRENT_STORES) + 1}`);
      console.log(`   Stores: ${batch.map(s => s.name).join(', ')}`);
      
      // Process batch concurrently
      const promises = batch.map(store => this.processStore(store));
      await Promise.allSettled(promises);
      
      // Brief pause between batches
      if (i + CONFIG.MAX_CONCURRENT_STORES < remainingStores.length) {
        console.log(`\n⏸️  Batch complete. Pausing 5 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    console.log("\n" + "=".repeat(50));
    console.log("🎉 MASS CRAWL COMPLETED!");
    console.log("=".repeat(50));
    console.log(`✅ Processed stores: ${this.processedStores.size}`);
    console.log(`❌ Failed stores: ${this.failedStores.size}`);
    console.log(`📦 Total products: ${this.totalProductsProcessed}`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`🚀 Average: ${Math.round(this.totalProductsProcessed / duration)} products/second`);
    
    if (this.failedStores.size > 0) {
      console.log(`\n⚠️  Failed stores: ${Array.from(this.failedStores).join(', ')}`);
    }
    
    console.log("\n💡 Your MCP can now search across ALL these brands dynamically!");
    console.log("🔍 Example queries:");
    console.log('   "Find red shoes from any brand"');
    console.log('   "Show me leather jackets from streetwear brands"');
    console.log('   "I want sustainable activewear"');
    console.log('   "Find luxury handbags under $500"');
  }

  async getStoresToRetry() {
    return Array.from(this.failedStores);
  }
}

// Main execution
async function main() {
  const crawler = new MassShopifyCrawler();
  await crawler.crawlAllStores();
}

// Export for use in other files
export { MassShopifyCrawler, SHOPIFY_STORES };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
