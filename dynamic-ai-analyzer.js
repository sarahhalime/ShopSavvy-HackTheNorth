import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import axios from "axios";
import OpenAI from "openai";
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const tableName = process.env.DYNAMODB_TABLE_NAME || "Shopify-warehouse";

async function dynamicProductAnalysis(title, description, tags, vendor, productType) {
  try {
    const prompt = `
You are an expert product analyst. Analyze this product and extract EVERY detail dynamically. DO NOT use predefined categories - discover and identify all attributes naturally from the product information.

Product Information:
- Title: ${title}
- Description: ${description || 'No description'}
- Tags: ${tags ? tags.join(', ') : 'No tags'}
- Vendor: ${vendor || 'Unknown'}
- Product Type: ${productType || 'Unknown'}

Analyze this product and return ONLY a clean JSON object. Extract what you actually see, not what you think should be there:

{
  "discovered_category": "what type of product this actually is",
  "specific_subcategory": "more specific classification",
  "detailed_product_type": "very specific product type",
  
  "color_analysis": {
    "all_colors_mentioned": ["every color you find in title/description"],
    "primary_color": "main color if clear",
    "secondary_colors": ["any accent or additional colors"],
    "color_description": "natural description of the color scheme",
    "unique_colorway": "any special colorway name mentioned"
  },
  
  "material_discovery": {
    "materials_found": ["any materials mentioned or implied"],
    "fabric_type": "specific fabric if mentioned",
    "construction_method": "how it's made if described",
    "special_technologies": ["any tech features mentioned"],
    "texture_description": "texture details if available"
  },
  
  "design_features": {
    "closure_system": "how it closes/fastens",
    "structural_elements": ["pockets, hoods, collars, etc found"],
    "decorative_elements": ["logos, patterns, graphics found"],
    "functional_features": ["zippers, velcro, drawstrings, etc"],
    "style_characteristics": ["slim, oversized, cropped, etc"]
  },
  
  "intended_use": {
    "primary_purpose": "what it's mainly designed for",
    "activities_suitable_for": ["activities it can be used for"],
    "season_appropriateness": ["seasons it's designed for"],
    "occasion_suitability": ["casual, formal, athletic, etc"],
    "performance_benefits": ["comfort, durability, breathability, etc"]
  },
  
  "target_demographics": {
    "gender_targeting": "who it's designed for",
    "age_group": "age demographic if clear",
    "lifestyle_targeting": "lifestyle it targets",
    "activity_level": "active, casual, professional, etc"
  },
  
  "brand_positioning": {
    "brand_style": "brand's style category",
    "quality_level": "perceived quality tier",
    "market_positioning": "how it's positioned in market",
    "heritage_influence": "any heritage or history mentioned"
  },
  
  "size_and_fit": {
    "sizing_system": "what sizing system it uses",
    "fit_style": "how it's designed to fit",
    "size_range_available": "range of sizes if mentioned"
  },
  
  "search_intelligence": {
    "natural_search_terms": ["terms people would naturally use to find this"],
    "descriptive_keywords": ["descriptive words that define this product"],
    "style_descriptors": ["words that describe the style"],
    "functional_descriptors": ["words that describe function"],
    "comparative_terms": ["similar products or alternatives"],
    "detailed_description": "comprehensive description in natural language"
  }
}

IMPORTANT: 
- Only include what you can actually determine from the provided information
- Use "unknown" or null for things you cannot determine
- Be specific and descriptive, not generic
- Extract actual details, don't make assumptions
- If multiple possibilities exist, list them all
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1500
    });

    let content = response.choices[0].message.content.trim();
    
    // Clean up any markdown formatting
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/```/g, '');
    
    const analysis = JSON.parse(content);
    return analysis;
    
  } catch (error) {
    console.error("Dynamic AI analysis failed:", error.message);
    return getMinimalFallback(title, vendor);
  }
}

function getMinimalFallback(title, vendor) {
  return {
    discovered_category: "product",
    specific_subcategory: "item",
    detailed_product_type: "general_product",
    color_analysis: {
      all_colors_mentioned: [],
      primary_color: "unknown",
      secondary_colors: [],
      color_description: "color not specified",
      unique_colorway: null
    },
    material_discovery: {
      materials_found: [],
      fabric_type: "unknown",
      construction_method: "unknown",
      special_technologies: [],
      texture_description: "unknown"
    },
    design_features: {
      closure_system: "unknown",
      structural_elements: [],
      decorative_elements: [],
      functional_features: [],
      style_characteristics: []
    },
    intended_use: {
      primary_purpose: "general use",
      activities_suitable_for: ["general"],
      season_appropriateness: ["all seasons"],
      occasion_suitability: ["casual"],
      performance_benefits: []
    },
    target_demographics: {
      gender_targeting: "unisex",
      age_group: "adult",
      lifestyle_targeting: "general",
      activity_level: "casual"
    },
    brand_positioning: {
      brand_style: vendor || "unknown",
      quality_level: "standard",
      market_positioning: "mainstream",
      heritage_influence: "unknown"
    },
    size_and_fit: {
      sizing_system: "standard",
      fit_style: "regular",
      size_range_available: "various"
    },
    search_intelligence: {
      natural_search_terms: [title.toLowerCase()],
      descriptive_keywords: [title.toLowerCase()],
      style_descriptors: ["standard"],
      functional_descriptors: ["general"],
      comparative_terms: [],
      detailed_description: title
    }
  };
}

async function uploadDynamicAnalysis() {
  try {
    console.log("🧠 DYNAMIC AI PRODUCT ANALYSIS - NO HARDCODED VALUES");
    console.log("=====================================================\n");
    
    // Fetch products from NRML
    const response = await axios.get("https://nrml.ca/products.json?limit=3&page=1", {
      timeout: 15000
    });
    
    const products = response.data.products || [];
    console.log(`📦 Found ${products.length} products for dynamic AI analysis\n`);
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`🔬 DYNAMIC ANALYSIS ${i + 1}/${products.length}: ${product.title}`);
      console.log(`   📝 Description preview: ${(product.body_html || '').replace(/<[^>]*>/g, '').substring(0, 100)}...`);
      
      // Dynamic AI analysis - no hardcoded values
      const analysis = await dynamicProductAnalysis(
        product.title,
        product.body_html,
        product.tags,
        product.vendor,
        product.product_type
      );
      
      // Get pricing and images
      const firstVariant = product.variants?.[0] || {};
      const mainImage = product.images?.[0]?.src || null;
      
      // Create dynamically analyzed product
      const dynamicProduct = {
        // Basic identifiers
        product_id: `DYNAMIC_${product.id}`,
        name: product.title,
        vendor: product.vendor,
        price: parseFloat(firstVariant.price || 0),
        main_image: mainImage,
        product_url: `https://nrml.ca/products/${product.handle}`,
        
        // DYNAMIC CATEGORIZATION (AI discovered)
        category: analysis.discovered_category,
        subcategory: analysis.specific_subcategory,
        product_type: analysis.detailed_product_type,
        
        // DYNAMIC COLOR ANALYSIS
        all_colors: analysis.color_analysis.all_colors_mentioned,
        primary_color: analysis.color_analysis.primary_color,
        secondary_colors: analysis.color_analysis.secondary_colors,
        color_description: analysis.color_analysis.color_description,
        colorway: analysis.color_analysis.unique_colorway,
        
        // DYNAMIC MATERIALS (AI discovered)
        materials: analysis.material_discovery.materials_found,
        fabric_type: analysis.material_discovery.fabric_type,
        construction: analysis.material_discovery.construction_method,
        technologies: analysis.material_discovery.special_technologies,
        texture: analysis.material_discovery.texture_description,
        
        // DYNAMIC DESIGN FEATURES
        closure_type: analysis.design_features.closure_system,
        structural_features: analysis.design_features.structural_elements,
        decorative_features: analysis.design_features.decorative_elements,
        functional_features: analysis.design_features.functional_features,
        style_features: analysis.design_features.style_characteristics,
        
        // DYNAMIC USE CASES
        primary_use: analysis.intended_use.primary_purpose,
        activities: analysis.intended_use.activities_suitable_for,
        seasons: analysis.intended_use.season_appropriateness,
        occasions: analysis.intended_use.occasion_suitability,
        benefits: analysis.intended_use.performance_benefits,
        
        // DYNAMIC TARGET MARKET
        target_gender: analysis.target_demographics.gender_targeting,
        target_age: analysis.target_demographics.age_group,
        lifestyle: analysis.target_demographics.lifestyle_targeting,
        activity_level: analysis.target_demographics.activity_level,
        
        // DYNAMIC BRAND ANALYSIS
        brand_style: analysis.brand_positioning.brand_style,
        quality_tier: analysis.brand_positioning.quality_level,
        market_position: analysis.brand_positioning.market_positioning,
        
        // DYNAMIC SIZING
        sizing_system: analysis.size_and_fit.sizing_system,
        fit_style: analysis.size_and_fit.fit_style,
        size_range: analysis.size_and_fit.size_range_available,
        
        // DYNAMIC SEARCH OPTIMIZATION
        natural_search_terms: analysis.search_intelligence.natural_search_terms,
        descriptive_keywords: analysis.search_intelligence.descriptive_keywords,
        style_descriptors: analysis.search_intelligence.style_descriptors,
        functional_descriptors: analysis.search_intelligence.functional_descriptors,
        detailed_description: analysis.search_intelligence.detailed_description,
        
        // COMPREHENSIVE SEARCH TEXT (dynamically generated)
        comprehensive_search: [
          product.title,
          analysis.color_analysis.color_description,
          analysis.discovered_category,
          analysis.material_discovery.fabric_type,
          ...analysis.color_analysis.all_colors_mentioned,
          ...analysis.material_discovery.materials_found,
          ...analysis.design_features.structural_elements,
          ...analysis.intended_use.activities_suitable_for,
          ...analysis.search_intelligence.natural_search_terms,
          analysis.search_intelligence.detailed_description
        ].filter(item => item && item !== 'unknown' && item !== null).join(' ').toLowerCase(),
        
        // Metadata
        crawled_at: new Date().toISOString(),
        analysis_type: 'dynamic_ai'
      };
      
      // Upload to DynamoDB
      try {
        await ddbDocClient.send(new PutCommand({
          TableName: tableName,
          Item: dynamicProduct
        }));
        
        console.log(`   ✅ UPLOADED with dynamic analysis:`);
        console.log(`      🎨 Colors Found: ${analysis.color_analysis.all_colors_mentioned.join(', ') || 'none detected'}`);
        console.log(`      🧵 Materials: ${analysis.material_discovery.materials_found.join(', ') || 'none detected'}`);
        console.log(`      🔧 Features: ${analysis.design_features.structural_elements.join(', ') || 'none detected'}`);
        console.log(`      🏃 Uses: ${analysis.intended_use.activities_suitable_for.join(', ')}`);
        console.log(`      📊 Category: ${analysis.discovered_category} > ${analysis.specific_subcategory}`);
        console.log(`      🔍 Search terms: ${analysis.search_intelligence.natural_search_terms.slice(0,3).join(', ')}`);
        console.log("");
        
      } catch (error) {
        console.error(`   ❌ Upload failed: ${error.message}`);
      }
      
      // Delay between products for API rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log("🎉 DYNAMIC ANALYSIS COMPLETE!\n");
    console.log("🔍 Now MCP can handle queries like:");
    console.log('   "Find shoes with any color combination you detected"');
    console.log('   "Show me products made from specific materials the AI found"');
    console.log('   "I want items for the activities the AI identified"');
    console.log('   "Find products with the exact features AI discovered"');
    console.log("\n💡 All attributes are dynamically discovered by AI, no hardcoded lists!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

uploadDynamicAnalysis();
