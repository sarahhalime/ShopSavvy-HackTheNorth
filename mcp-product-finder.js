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
      const rankedResults = await this.scoreAndRankResults(matchedProducts, queryAnalysis);
      
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
You are an expert e-commerce product search analyst. Analyze this customer query and extract ALL possible search criteria and characteristics.

Customer Query: "${query}"

Extract and return ONLY a JSON object with comprehensive characteristics:

{
  "intent": "what the customer is looking for",
  "product_type": "type of product they want",
  "colors": ["any colors mentioned or implied"],
  "materials": ["any materials mentioned like leather, cotton, wool, synthetic"],
  "style_preferences": ["style keywords like casual, formal, vintage, modern, retro"],
  "activity_use": ["intended activities like running, work, party, hiking, gym"],
  "size_hints": ["any size preferences like small, large, XL, 10, etc"],
  "price_hints": ["budget indicators like cheap, expensive, under $100, premium"],
  "brand_preferences": ["any brands mentioned like Nike, Adidas, Apple"],
  "feature_requirements": ["specific features like waterproof, comfortable, breathable"],
  "fit_preferences": ["fit types like slim, regular, loose, tight"],
  "season_weather": ["seasonal hints like winter, summer, rain, snow"],
  "occasion_type": ["occasion like work, casual, formal, party, wedding"],
  "age_gender": ["age/gender hints like mens, womens, kids, adult"],
  "technology_features": ["tech features like wireless, bluetooth, smart"],
  "sustainability": ["eco hints like organic, recycled, sustainable"],
  "performance_specs": ["performance needs like speed, durability, lightweight"],
  "design_aesthetics": ["design elements like minimalist, bold, classic"],
  "comfort_requirements": ["comfort needs like cushioned, soft, ergonomic"],
  "durability_needs": ["durability requirements like heavy-duty, long-lasting"],
  "special_conditions": ["special needs like hypoallergenic, vegan, non-slip"],
  "urgency": "how urgent this request seems",
  "specificity": "how specific vs general this query is",
  "synonyms_to_consider": ["alternative terms for the main product"],
  "search_strategy": "best approach for this query"
}

Be extremely thorough in extracting characteristics. Examples:
- "comfortable running shoes" → comfort_requirements: ["comfortable"], activity_use: ["running"]
- "waterproof winter boots" → feature_requirements: ["waterproof"], season_weather: ["winter"]
- "premium leather wallet" → materials: ["leather"], price_hints: ["premium"]
- "women's casual dress" → age_gender: ["womens"], style_preferences: ["casual"]
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 800
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

    console.log(`🔍 Filtering ${products.length} products for query analysis:`, analysis);

    for (const product of products) {
      const matchScore = this.calculateMatchScore(product, analysis);
      
      // STRICT: Only include products with meaningful scores (20+ points)
      if (matchScore.totalScore >= 20) {
        matched.push({
          ...product,
          matchScore: matchScore.totalScore,
          matchReasons: matchScore.reasons,
          relevanceFactors: matchScore.factors
        });
      }
    }

    console.log(`✅ Found ${matched.length} relevant products after filtering`);
    return matched;
  }

  calculateMatchScore(product, analysis) {
    let score = 0;
    const reasons = [];
    const factors = {};

    // STRICT FILTERING: Product type is MANDATORY for relevance
    const productTypeMatch = this.matchesProductType(product, analysis.product_type, analysis.synonyms_to_consider);
    
    // If no product type match, immediately return very low score
    if (analysis.product_type && !productTypeMatch) {
      return { totalScore: 0, reasons: [`Not a ${analysis.product_type} - irrelevant product`], factors: { irrelevant: true } };
    }

    // Product type match is required for any meaningful score
    if (productTypeMatch) {
      score += 100; // High base score for correct product type
      reasons.push(`Correct product type: ${analysis.product_type}`);
      factors.productTypeMatch = true;
    } else {
      // Without product type match, don't even consider other factors
      return { totalScore: 0, reasons: [`No product type match`], factors: { noMatch: true } };
    }

    // Now check color if specified - STRICT COLOR FILTERING
    const colorMatch = this.matchesColor(product, analysis.colors);
    if (analysis.colors.length > 0) {
      if (colorMatch.matched) {
        score += 50; // Bonus for color match
        reasons.push(`Color match: ${colorMatch.matchedColor}`);
        factors.colorMatch = colorMatch.matchedColor;
      } else {
        // STRICT: If color is specified but doesn't match, return 0 score
        return { totalScore: 0, reasons: [`Wrong color - looking for ${analysis.colors.join(', ')}, found different color`], factors: { wrongColor: true } };
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
    if (analysis.brand_preferences && analysis.brand_preferences.length > 0) {
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

    // NEW CHARACTERISTIC MATCHING
    
    // Fit preferences
    const fitMatch = this.matchesCharacteristic(product, analysis.fit_preferences, ['fit_type', 'sizing_fit', 'cut_style']);
    if (fitMatch.matched) {
      score += 15;
      reasons.push(`Fit match: ${fitMatch.matchedItems.join(', ')}`);
      factors.fitMatch = fitMatch.matchedItems;
    }

    // Season/Weather
    const seasonMatch = this.matchesCharacteristic(product, analysis.season_weather, ['season', 'weather_condition', 'name']);
    if (seasonMatch.matched) {
      score += 15;
      reasons.push(`Season match: ${seasonMatch.matchedItems.join(', ')}`);
      factors.seasonMatch = seasonMatch.matchedItems;
    }

    // Occasion type
    const occasionMatch = this.matchesCharacteristic(product, analysis.occasion_type, ['occasion', 'event_type', 'dress_code']);
    if (occasionMatch.matched) {
      score += 15;
      reasons.push(`Occasion match: ${occasionMatch.matchedItems.join(', ')}`);
      factors.occasionMatch = occasionMatch.matchedItems;
    }

    // Age/Gender
    const genderMatch = this.matchesCharacteristic(product, analysis.age_gender, ['gender', 'target_demographic', 'age_group', 'name']);
    if (genderMatch.matched) {
      score += 20;
      reasons.push(`Gender/Age match: ${genderMatch.matchedItems.join(', ')}`);
      factors.genderMatch = genderMatch.matchedItems;
    }

    // Technology features
    const techMatch = this.matchesCharacteristic(product, analysis.technology_features, ['tech_features', 'connectivity', 'smart_features']);
    if (techMatch.matched) {
      score += 25;
      reasons.push(`Tech match: ${techMatch.matchedItems.join(', ')}`);
      factors.techMatch = techMatch.matchedItems;
    }

    // Sustainability
    const sustainabilityMatch = this.matchesCharacteristic(product, analysis.sustainability, ['sustainability_features', 'eco_friendly', 'organic_certified']);
    if (sustainabilityMatch.matched) {
      score += 15;
      reasons.push(`Sustainability match: ${sustainabilityMatch.matchedItems.join(', ')}`);
      factors.sustainabilityMatch = sustainabilityMatch.matchedItems;
    }

    // Performance specs
    const performanceMatch = this.matchesCharacteristic(product, analysis.performance_specs, ['performance_features', 'technical_specs', 'performance_tech']);
    if (performanceMatch.matched) {
      score += 20;
      reasons.push(`Performance match: ${performanceMatch.matchedItems.join(', ')}`);
      factors.performanceMatch = performanceMatch.matchedItems;
    }

    // Design aesthetics
    const designMatch = this.matchesCharacteristic(product, analysis.design_aesthetics, ['design_style', 'aesthetic', 'visual_style']);
    if (designMatch.matched) {
      score += 10;
      reasons.push(`Design match: ${designMatch.matchedItems.join(', ')}`);
      factors.designMatch = designMatch.matchedItems;
    }

    // Comfort requirements
    const comfortMatch = this.matchesCharacteristic(product, analysis.comfort_requirements, ['comfort_features', 'ergonomic_features', 'cushioning']);
    if (comfortMatch.matched) {
      score += 15;
      reasons.push(`Comfort match: ${comfortMatch.matchedItems.join(', ')}`);
      factors.comfortMatch = comfortMatch.matchedItems;
    }

    // Durability needs
    const durabilityMatch = this.matchesCharacteristic(product, analysis.durability_needs, ['durability_features', 'build_quality', 'longevity_features']);
    if (durabilityMatch.matched) {
      score += 15;
      reasons.push(`Durability match: ${durabilityMatch.matchedItems.join(', ')}`);
      factors.durabilityMatch = durabilityMatch.matchedItems;
    }

    // Special conditions
    const specialMatch = this.matchesCharacteristic(product, analysis.special_conditions, ['special_features', 'health_considerations', 'accessibility_features']);
    if (specialMatch.matched) {
      score += 20;
      reasons.push(`Special conditions match: ${specialMatch.matchedItems.join(', ')}`);
      factors.specialMatch = specialMatch.matchedItems;
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

    const targetLower = targetType.toLowerCase();

    // ENHANCED: More precise word matching to avoid false positives
    const productWords = productFields.split(/[\s\-_(),]+/).filter(word => word.length > 2);

    // Direct word match (not just substring)
    if (productWords.includes(targetLower)) return true;

    // Synonym matching with word boundaries
    for (const synonym of (synonyms || [])) {
      const synonymLower = synonym.toLowerCase();
      if (productWords.includes(synonymLower)) return true;
    }

    // Industry category mapping with stricter matching
    for (const [category, aliases] of Object.entries(this.industryRules.categoryMapping)) {
      if (aliases.includes(targetLower) || category === targetLower) {
        // Check if any category words appear as complete words
        if (productWords.includes(category)) return true;
        for (const alias of aliases) {
          if (productWords.includes(alias)) return true;
        }
      }
    }

    // Special handling for shoes/footwear
    if (targetLower === 'shoes' || targetLower === 'shoe') {
      const shoeIndicators = ['shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'sandal', 'sandals', 
                             'heel', 'heels', 'flat', 'flats', 'loafer', 'loafers', 'runner', 'runners', 
                             'trainer', 'trainers', 'footwear', 'oxford', 'moccasin'];
      return shoeIndicators.some(indicator => productWords.includes(indicator));
    }

    return false;
  }

  matchesColor(product, targetColors) {
    if (!targetColors || targetColors.length === 0) return { matched: false };

    // Focus on PRIMARY product colors first, then name
    const primaryColors = [
      product.primary_color,
      product.color_primary,
      product.color_description
    ].filter(Boolean).join(' ').toLowerCase();

    // Extract main color from product name (ignore sole/accent colors)
    const productName = (product.name || '').toLowerCase();
    
    // Remove sole/accent color mentions to focus on main product color
    const cleanedName = productName
      .replace(/\(.*sole.*\)/gi, '')  // Remove "(Natural White Sole)" etc
      .replace(/\(.*\)/gi, '')        // Remove any other parentheses
      .replace(/sole/gi, '')          // Remove "sole" mentions
      .replace(/with.*$/gi, '');      // Remove "with..." descriptions

    const productColors = [primaryColors, cleanedName].filter(Boolean).join(' ').toLowerCase();

    const colorWords = productColors.split(/[\s\-_(),]+/).filter(word => word.length > 2);

    console.log(`🎨 Color matching for "${targetColors.join(',')}" against product colors:`, productColors);

    for (const targetColor of targetColors) {
      const colorLower = targetColor.toLowerCase();
      
      // STRICT color families - only exact matches
      const colorFamilies = {
        'red': {
          include: ['red', 'crimson', 'ruby', 'cherry', 'burgundy', 'wine', 'poppy', 'scarlet', 'maroon'],
          exclude: ['white', 'natural', 'cream', 'black', 'blue', 'green', 'yellow', 'sunshine', 'gold', 'forest', 'light']
        },
        'blue': {
          include: ['blue', 'navy', 'royal', 'azure', 'cobalt', 'sapphire'],
          exclude: ['white', 'natural', 'cream', 'black', 'red', 'green', 'yellow', 'forest', 'light']
        },
        'black': {
          include: ['black', 'charcoal', 'onyx', 'midnight', 'ebony', 'jet'],
          exclude: ['white', 'natural', 'cream', 'light', 'bright', 'forest', 'blue', 'green']
        },
        'white': {
          include: ['white', 'ivory', 'cream', 'pearl', 'snow', 'off-white', 'natural'],
          exclude: ['black', 'dark', 'deep', 'forest', 'green', 'blue', 'red', 'yellow']
        },
        'green': {
          include: ['green', 'forest', 'emerald', 'olive', 'sage', 'mint'],
          exclude: ['white', 'natural', 'cream', 'black', 'red', 'blue', 'yellow', 'light']
        },
        'yellow': {
          include: ['yellow', 'gold', 'lemon', 'sunshine', 'amber', 'mustard'],
          exclude: ['white', 'natural', 'cream', 'black', 'red', 'blue', 'green', 'forest']
        }
      };

      const family = colorFamilies[colorLower];
      if (family) {
        // STRICT EXCLUSION: If any excluded color is found, immediately reject
        const hasExcluded = family.exclude.some(excludeColor => 
          colorWords.includes(excludeColor)
        );
        
        if (hasExcluded) {
          console.log(`❌ Color excluded: found ${family.exclude.filter(exc => colorWords.includes(exc))} in product`);
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
          console.log(`✅ Color match found: ${matchedWord}`);
          return { matched: true, matchedColor: `${targetColor} (${matchedWord})` };
        }
      } else {
        // Direct match for colors not in families
        if (colorWords.includes(colorLower)) {
          console.log(`✅ Direct color match: ${colorLower}`);
          return { matched: true, matchedColor: targetColor };
        }
      }
    }

    console.log(`❌ No color match found for ${targetColors.join(',')}`);
    return { matched: false };
  }

  // Generic characteristic matching function
  matchesCharacteristic(product, targetCharacteristics, productFields) {
    if (!targetCharacteristics || targetCharacteristics.length === 0) return { matched: false };

    const productData = productFields.map(field => product[field]).filter(Boolean).join(' ').toLowerCase();
    const productWords = productData.split(/[\s\-_(),]+/).filter(word => word.length > 2);

    const matchedItems = [];

    for (const characteristic of targetCharacteristics) {
      const charLower = characteristic.toLowerCase();
      
      // Direct word match
      if (productWords.includes(charLower)) {
        matchedItems.push(characteristic);
        continue;
      }

      // Partial match for compound characteristics
      if (productData.includes(charLower)) {
        matchedItems.push(characteristic);
        continue;
      }

      // Common synonyms and variations
      const synonymMap = {
        'men': ['mens', 'male', 'man'],
        'women': ['womens', 'female', 'woman', 'ladies'],
        'kids': ['children', 'child', 'youth', 'junior'],
        'casual': ['everyday', 'informal', 'relaxed'],
        'formal': ['dress', 'business', 'professional'],
        'comfortable': ['comfort', 'cushioned', 'soft'],
        'waterproof': ['water-resistant', 'water-repellent', 'weatherproof'],
        'lightweight': ['light', 'lite', 'ultralight'],
        'durable': ['sturdy', 'robust', 'heavy-duty'],
        'winter': ['cold', 'snow', 'insulated'],
        'summer': ['warm', 'breathable', 'cooling'],
        'premium': ['luxury', 'high-end', 'deluxe'],
        'cheap': ['budget', 'affordable', 'economy'],
        'slim': ['skinny', 'narrow', 'fitted'],
        'loose': ['relaxed', 'baggy', 'oversized']
      };

      if (synonymMap[charLower]) {
        for (const synonym of synonymMap[charLower]) {
          if (productWords.includes(synonym) || productData.includes(synonym)) {
            matchedItems.push(characteristic);
            break;
          }
        }
      }
    }

    return {
      matched: matchedItems.length > 0,
      matchedItems: matchedItems
    };
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

  async scoreAndRankResults(products, analysis) {
    const sortedProducts = products.sort((a, b) => b.matchScore - a.matchScore);
    
    // Use GPT to clean and improve product names
    const cleanedProducts = await Promise.all(
      sortedProducts.map(async (product, index) => {
        const cleanedName = await this.cleanProductName(product.name);
        return {
          name: cleanedName,
          price: product.price,
          image: product.image || product.main_image,
          source_store: product.source_store,
          vendor: product.vendor,
          rank: index + 1,
          matchScore: product.matchScore
        };
      })
    );
    
    return cleanedProducts;
  }

  async cleanProductName(productName) {
    if (!productName) return "Unknown Product";
    
    try {
      const prompt = `Clean up this product name to be more readable and customer-friendly. Remove unnecessary details, fix formatting, but keep essential information like color, brand, and product type.

Original: "${productName}"

Return ONLY the cleaned product name, nothing else.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 100
      });

      const cleaned = response.choices[0].message.content.trim();
      return cleaned || productName;
    } catch (error) {
      console.error("Error cleaning product name:", error);
      return productName;
    }
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
      model: "gpt-4-turbo",
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
const PORT = process.env.MCP_PORT || 3002;
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
