import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import OpenAI from "openai";
import express from "express";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

// Initialize clients
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

class MCPProductFinder {
  constructor() {
    this.industryRules = {
      // Industry-standard product matching rules
      colorSynonyms: {
        "red": ["crimson", "burgundy", "maroon", "cherry", "scarlet", "brick"],
        "blue": ["navy", "royal", "cobalt", "azure", "teal", "cerulean"],
        "black": ["charcoal", "onyx", "midnight", "ebony", "jet"],
        "white": ["cream", "ivory", "off-white", "snow", "pearl"],
        "brown": ["tan", "camel", "cognac", "chocolate", "espresso", "mocha"],
        "green": ["olive", "forest", "emerald", "sage", "mint", "lime"],
        "grey": ["gray", "silver", "slate", "steel", "ash", "pewter"],
        "yellow": ["gold", "amber", "honey", "mustard", "canary"],
        "orange": ["coral", "peach", "rust", "copper", "bronze"],
        "purple": ["violet", "lavender", "plum", "magenta", "indigo"]
      },
      
      categoryMapping: {
        "shoes": ["sneakers", "boots", "sandals", "loafers", "heels", "flats", "footwear"],
        "clothing": ["apparel", "garments", "wear", "outfit", "attire"],
        "jackets": ["coats", "outerwear", "blazers", "windbreakers", "parkas"],
        "accessories": ["bags", "hats", "belts", "jewelry", "scarves", "gloves"]
      },
      
      materialAliases: {
        "leather": ["genuine leather", "full grain", "top grain", "suede", "nubuck"],
        "cotton": ["organic cotton", "cotton blend", "pure cotton"],
        "synthetic": ["polyester", "nylon", "acrylic", "polypropylene"],
        "wool": ["merino", "cashmere", "lambswool", "alpaca"]
      },
      
      activityMapping: {
        "running": ["jogging", "marathon", "sprint", "cardio", "fitness"],
        "hiking": ["trekking", "outdoor", "trail", "mountain", "adventure"],
        "casual": ["everyday", "lifestyle", "street", "daily", "regular"],
        "formal": ["business", "office", "professional", "dress", "work"],
        "sports": ["athletic", "training", "gym", "workout", "exercise"]
      }
    };
  }

  async intelligentProductSearch(userQuery) {
    try {
      // Step 1: Use AI to understand and parse the query
      const queryAnalysis = await this.analyzeUserQuery(userQuery);
      
      // Step 2: Get all products from database
      const allProducts = await this.getAllProducts();
      
      // Step 3: Apply intelligent matching
      const matchedProducts = this.applyIntelligentMatching(allProducts, queryAnalysis);
      
      // Step 4: Score and rank results
      const rankedResults = this.scoreAndRankResults(matchedProducts, queryAnalysis);
      
      // Step 5: Return clean results without AI response generation
      return {
        query: userQuery,
        results: rankedResults.slice(0, 10), // Top 10 results - name, price, image only
        count: rankedResults.length
      };
      
    } catch (error) {
      console.error("Search error:", error);
      return {
        error: "Search failed",
        message: error.message
      };
    }
  }

  async analyzeUserQuery(query) {
    const prompt = `
You are an expert e-commerce product search analyst. Analyze this customer query and extract all relevant search criteria using retail industry standards.

Customer Query: "${query}"

Extract and return ONLY a JSON object with the following structure:

{
  "intent": "what the customer is looking for",
  "product_type": "type of product they want",
  "colors": ["any colors mentioned or implied"],
  "materials": ["any materials mentioned"],
  "style_preferences": ["style keywords like casual, formal, vintage"],
  "activity_use": ["intended activities like running, work, party"],
  "size_hints": ["any size preferences mentioned"],
  "price_hints": ["budget indicators like cheap, expensive, under $100"],
  "brand_preferences": ["any brands mentioned"],
  "feature_requirements": ["specific features like waterproof, comfortable"],
  "urgency": "how urgent this request seems",
  "specificity": "how specific vs general this query is",
  "synonyms_to_consider": ["alternative terms for the main product"],
  "search_strategy": "best approach for this query"
}

Be intelligent about synonyms and implications. For example:
- "red shoes" should include burgundy, crimson, maroon variations
- "sneakers" should also match "shoes", "trainers", "athletic footwear"
- "waterproof jacket" implies outdoor, rain, weather protection
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 600
    });

    let content = response.choices[0].message.content.trim();
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/```/g, '');
    
    return JSON.parse(content);
  }

  async getAllProducts() {
    const params = {
      TableName: tableName
    };

    const allItems = [];
    let lastEvaluatedKey = null;

    do {
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await ddbDocClient.send(new ScanCommand(params));
      allItems.push(...(result.Items || []));
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return allItems;
  }

  applyIntelligentMatching(products, analysis) {
    const matched = [];

    for (const product of products) {
      const matchScore = this.calculateMatchScore(product, analysis);
      
      if (matchScore.totalScore > 0) {
        matched.push({
          ...product,
          matchScore: matchScore.totalScore,
          matchReasons: matchScore.reasons,
          relevanceFactors: matchScore.factors
        });
      }
    }

    return matched;
  }

  calculateMatchScore(product, analysis) {
    let score = 0;
    const reasons = [];
    const factors = {};

    // ENHANCED: Require both product type AND color if both are specified
    const productTypeMatch = this.matchesProductType(product, analysis.product_type, analysis.synonyms_to_consider);
    const colorMatch = this.matchesColor(product, analysis.colors);
    
    // If user specified BOTH color and product type, BOTH must match STRICTLY
    if (analysis.colors.length > 0 && analysis.product_type) {
      if (productTypeMatch && colorMatch.matched) {
        score += 100; // Very high score for exact match
        reasons.push(`Exact match: ${colorMatch.matchedColor} ${analysis.product_type}`);
        factors.exactMatch = true;
      } else {
        // STRICT: If color is specified but doesn't match, score very low
        return { totalScore: 1, reasons: [`Wrong color for ${analysis.product_type} - looking for ${analysis.colors.join(', ')}`], factors: { wrongColor: true } };
      }
    } else {
      // Original logic for single criteria
      if (productTypeMatch) {
        score += 50;
        reasons.push(`Matches product type: ${analysis.product_type}`);
        factors.productTypeMatch = true;
      }

      if (colorMatch.matched) {
        score += 30;
        reasons.push(`Color match: ${colorMatch.matchedColor}`);
        factors.colorMatch = colorMatch.matchedColor;
      }
    }

    // Material matching
    const materialMatch = this.matchesMaterial(product, analysis.materials);
    if (materialMatch.matched) {
      score += 20;
      reasons.push(`Material match: ${materialMatch.matchedMaterial}`);
      factors.materialMatch = materialMatch.matchedMaterial;
    }

    // Activity/use case matching
    const activityMatch = this.matchesActivity(product, analysis.activity_use);
    if (activityMatch.matched) {
      score += 25;
      reasons.push(`Activity match: ${activityMatch.matchedActivity}`);
      factors.activityMatch = activityMatch.matchedActivity;
    }

    // Style matching
    const styleMatch = this.matchesStyle(product, analysis.style_preferences);
    if (styleMatch.matched) {
      score += 15;
      reasons.push(`Style match: ${styleMatch.matchedStyle}`);
      factors.styleMatch = styleMatch.matchedStyle;
    }

    // Brand matching
    if (analysis.brand_preferences.length > 0) {
      const brandMatch = this.matchesBrand(product, analysis.brand_preferences);
      if (brandMatch) {
        score += 35;
        reasons.push(`Brand match: ${brandMatch}`);
        factors.brandMatch = brandMatch;
      }
    }

    // Feature matching
    const featureMatch = this.matchesFeatures(product, analysis.feature_requirements);
    if (featureMatch.matched) {
      score += 20;
      reasons.push(`Feature match: ${featureMatch.features.join(', ')}`);
      factors.featureMatch = featureMatch.features;
    }

    // Text search fallback
    const textMatch = this.fuzzyTextMatch(product, analysis.intent);
    if (textMatch > 0) {
      score += textMatch;
      reasons.push("Text similarity match");
      factors.textMatch = textMatch;
    }

    return {
      totalScore: score,
      reasons: reasons,
      factors: factors
    };
  }

  matchesProductType(product, targetType, synonyms) {
    if (!targetType) return false;
    
    const productFields = [
      product.category,
      product.subcategory,
      product.product_type,
      product.name,
      product.discovered_category,
      product.specific_subcategory
    ].filter(Boolean).join(' ').toLowerCase();

    // Direct match
    if (productFields.includes(targetType.toLowerCase())) return true;

    // Synonym matching
    for (const synonym of (synonyms || [])) {
      if (productFields.includes(synonym.toLowerCase())) return true;
    }

    // Industry category mapping
    for (const [category, aliases] of Object.entries(this.industryRules.categoryMapping)) {
      if (aliases.includes(targetType.toLowerCase()) || category === targetType.toLowerCase()) {
        if (productFields.includes(category) || aliases.some(alias => productFields.includes(alias))) {
          return true;
        }
      }
    }

    return false;
  }

  matchesColor(product, targetColors) {
    if (!targetColors || targetColors.length === 0) return { matched: false };

    const productColors = [
      product.primary_color,
      product.secondary_color,
      product.color_primary,
      product.color_description,
      ...(product.all_colors || []),
      ...(product.secondary_colors || []),
      product.name
    ].filter(Boolean).join(' ').toLowerCase();

    const colorWords = productColors.split(/[\s\-_(),]+/);

    for (const targetColor of targetColors) {
      const colorLower = targetColor.toLowerCase();
      
      // Enhanced color families with exclusions
      const colorFamilies = {
        'red': {
          include: ['red', 'crimson', 'ruby', 'cherry', 'burgundy', 'wine', 'poppy', 'scarlet', 'maroon'],
          exclude: ['white', 'natural', 'cream', 'black', 'blue', 'green', 'yellow', 'sunshine', 'gold']
        },
        'blue': {
          include: ['blue', 'navy', 'royal', 'azure', 'cobalt', 'sapphire', 'teal', 'turquoise'],
          exclude: ['white', 'natural', 'cream', 'black', 'red', 'green', 'yellow']
        },
        'black': {
          include: ['black', 'charcoal', 'onyx', 'midnight', 'ebony', 'jet'],
          exclude: ['white', 'natural', 'cream', 'light', 'bright']
        },
        'white': {
          include: ['white', 'ivory', 'cream', 'pearl', 'snow', 'off-white', 'natural'],
          exclude: ['black', 'dark', 'deep']
        },
        'green': {
          include: ['green', 'forest', 'emerald', 'olive', 'sage', 'mint'],
          exclude: ['white', 'natural', 'cream', 'black', 'red', 'blue', 'yellow']
        },
        'yellow': {
          include: ['yellow', 'gold', 'lemon', 'sunshine', 'amber', 'mustard'],
          exclude: ['white', 'natural', 'cream', 'black', 'red', 'blue', 'green']
        }
      };

      const family = colorFamilies[colorLower];
      if (family) {
        // Check for exclusions first - if found, no match
        const hasExcluded = family.exclude.some(excludeColor => 
          colorWords.includes(excludeColor)
        );
        
        if (hasExcluded) {
          continue; // Skip this color due to exclusion
        }
        
        // Check for included colors
        const hasIncluded = family.include.some(includeColor => 
          colorWords.includes(includeColor)
        );
        
        if (hasIncluded) {
          const matchedWord = family.include.find(includeColor => 
            colorWords.includes(includeColor)
          );
          return { matched: true, matchedColor: `${targetColor} (${matchedWord})` };
        }
      } else {
        // Direct match for colors not in families
        if (colorWords.includes(colorLower)) {
          return { matched: true, matchedColor: targetColor };
        }
      }
    }

    return { matched: false };
  }

  matchesMaterial(product, targetMaterials) {
    if (!targetMaterials || targetMaterials.length === 0) return { matched: false };

    const productMaterials = [
      product.primary_material,
      product.fabric_type,
      ...(product.materials || []),
      ...(product.secondary_materials || []),
      product.name
    ].filter(Boolean).join(' ').toLowerCase();

    for (const targetMaterial of targetMaterials) {
      const materialLower = targetMaterial.toLowerCase();
      
      if (productMaterials.includes(materialLower)) {
        return { matched: true, matchedMaterial: targetMaterial };
      }

      // Check material aliases
      for (const [material, aliases] of Object.entries(this.industryRules.materialAliases)) {
        if (aliases.includes(materialLower) || material === materialLower) {
          if (productMaterials.includes(material) || aliases.some(alias => productMaterials.includes(alias))) {
            return { matched: true, matchedMaterial: `${targetMaterial} (${material})` };
          }
        }
      }
    }

    return { matched: false };
  }

  matchesActivity(product, targetActivities) {
    if (!targetActivities || targetActivities.length === 0) return { matched: false };

    const productActivities = [
      product.activity,
      product.primary_use,
      ...(product.activities || []),
      ...(product.activity_type || []),
      ...(product.use_case_keywords || []),
      product.name
    ].filter(Boolean).join(' ').toLowerCase();

    for (const targetActivity of targetActivities) {
      const activityLower = targetActivity.toLowerCase();
      
      if (productActivities.includes(activityLower)) {
        return { matched: true, matchedActivity: targetActivity };
      }

      // Check activity mapping
      for (const [activity, aliases] of Object.entries(this.industryRules.activityMapping)) {
        if (aliases.includes(activityLower) || activity === activityLower) {
          if (productActivities.includes(activity) || aliases.some(alias => productActivities.includes(alias))) {
            return { matched: true, matchedActivity: `${targetActivity} (${activity})` };
          }
        }
      }
    }

    return { matched: false };
  }

  matchesStyle(product, targetStyles) {
    if (!targetStyles || targetStyles.length === 0) return { matched: false };

    const productStyles = [
      product.style_category,
      product.fit_type,
      ...(product.style_keywords || []),
      ...(product.style_features || []),
      product.name
    ].filter(Boolean).join(' ').toLowerCase();

    for (const targetStyle of targetStyles) {
      if (productStyles.includes(targetStyle.toLowerCase())) {
        return { matched: true, matchedStyle: targetStyle };
      }
    }

    return { matched: false };
  }

  matchesBrand(product, targetBrands) {
    const productBrand = (product.vendor || product.brand || '').toLowerCase();
    
    for (const targetBrand of targetBrands) {
      if (productBrand.includes(targetBrand.toLowerCase())) {
        return targetBrand;
      }
    }
    
    return null;
  }

  matchesFeatures(product, targetFeatures) {
    if (!targetFeatures || targetFeatures.length === 0) return { matched: false };

    const productFeatures = [
      ...(product.special_features || []),
      ...(product.functional_features || []),
      ...(product.performance_tech || []),
      ...(product.technologies || []),
      ...(product.construction_details || []),
      product.name
    ].filter(Boolean).join(' ').toLowerCase();

    const matchedFeatures = [];
    
    for (const targetFeature of targetFeatures) {
      if (productFeatures.includes(targetFeature.toLowerCase())) {
        matchedFeatures.push(targetFeature);
      }
    }

    return {
      matched: matchedFeatures.length > 0,
      features: matchedFeatures
    };
  }

  fuzzyTextMatch(product, searchText) {
    if (!searchText) return 0;

    const productText = [
      product.name,
      product.category,
      product.subcategory,
      product.comprehensive_search,
      product.enhanced_search_text,
      product.search_text
    ].filter(Boolean).join(' ').toLowerCase();

    const searchLower = searchText.toLowerCase();
    const words = searchLower.split(' ');
    
    let matchCount = 0;
    for (const word of words) {
      if (word.length > 2 && productText.includes(word)) {
        matchCount++;
      }
    }

    return Math.min(matchCount * 5, 20); // Max 20 points for text matching
  }

  scoreAndRankResults(products, analysis) {
    return products
      .sort((a, b) => b.matchScore - a.matchScore)
      .map((product, index) => ({
        name: product.name,
        price: product.price,
        image: product.image || product.main_image,  // Fixed: use correct field name
        source_store: product.source_store,          // Fixed: include store field
        vendor: product.vendor,                      // Fixed: include vendor field  
        rank: index + 1,
        matchScore: product.matchScore
      }));
  }

  async generateIntelligentResponse(query, results, analysis) {
    if (results.length === 0) {
      return `I couldn't find any products matching "${query}". Try being more general or checking if we have similar items in stock.`;
    }

    const prompt = `
You are a knowledgeable product assistant. A customer asked: "${query}"

Based on search analysis, they're looking for: ${JSON.stringify(analysis, null, 2)}

I found ${results.length} matching products. Here are the top results:

${results.slice(0, 5).map((product, i) => `
${i + 1}. ${product.name} - $${product.price}
   Category: ${product.category || product.discovered_category}
   Colors: ${product.primary_color || product.color_description || 'Not specified'}
   Match Score: ${product.matchScore}
   Why it matches: ${product.matchReasons.join(', ')}
`).join('')}

Generate a helpful, conversational response that:
1. Acknowledges what they're looking for
2. Highlights the best matches and why they're good fits
3. Mentions key details like colors, materials, prices
4. Suggests alternatives if needed
5. Keeps it natural and helpful, not robotic

Be enthusiastic and helpful!
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 400
    });

    return response.choices[0].message.content;
  }
}

// Express API for MCP Product Finder
const app = express();
app.use(express.json());

const productFinder = new MCPProductFinder();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Main product search endpoint
app.post('/api/find', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🔍 MCP Search: "${query}"`);
    const result = await productFinder.intelligentProductSearch(query);
    
    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// Simple search endpoint - clean results only
app.get('/api/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    console.log(`🔍 Quick Search: "${query}"`);
    
    const result = await productFinder.intelligentProductSearch(query);
    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Clean endpoint - just name, price, image
app.get('/api/clean/:query', async (req, res) => {
  try {
    const query = req.params.query;
    console.log(`🔍 Clean Search: "${query}"`);
    
    const result = await productFinder.intelligentProductSearch(query);
    
    if (result.error) {
      return res.status(500).json({ error: result.error, message: result.message });
    }
    
    // Return only essential info with store name
    const cleanResults = result.results?.map(product => ({
      name: product.name || 'Unknown Product',
      price: product.price ? `$${product.price}` : 'Price not available',
      image: product.image || null,
      store: product.source_store || product.vendor || 'Unknown Store'
    })) || [];
    
    res.json({
      query: query,
      products: cleanResults,
      found: cleanResults.length
    });
  } catch (error) {
    console.error('Clean search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message,
      query: req.params.query 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'MCP Product Finder is running!', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.MCP_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🤖 MCP PRODUCT FINDER AGENT RUNNING ON PORT ${PORT}`);
  console.log(`🔍 Intelligent product search with industry rules activated`);
  console.log(`📋 Endpoints:`);
  console.log(`   POST /api/find (body: {"query": "red shoes"})`);
  console.log(`   GET  /api/search/:query`);
  console.log(`   GET  /api/clean/:query (clean response: name, price, image only)`);
  console.log(`   GET  /health`);
  console.log(`\n💡 Example queries:`);
  console.log(`   "I want red shoes"`);
  console.log(`   "Show me waterproof jackets for hiking"`);
  console.log(`   "Find running sneakers under $200"`);
  console.log(`   "I need a leather bag for work"`);
});

export default app;
