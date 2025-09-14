/**
 * Environment configuration and mock mode settings
 */

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development'

// Environment variables
export const env = {
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  
  // Shopify
  SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
  SHOPIFY_STOREFRONT_TOKEN: process.env.SHOPIFY_STOREFRONT_TOKEN,
  SHOPIFY_ADMIN_TOKEN: process.env.SHOPIFY_ADMIN_TOKEN,
  
  // Database
  DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'shopsavvy-products',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  
  // Solana
  SOLANA_NETWORK: process.env.SOLANA_NETWORK || 'devnet',
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
  
  // Other services
  COHERE_API_KEY: process.env.COHERE_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
}

// Mock mode configuration
// This determines whether to use real APIs or mock data
export const isMockMode = {
  // Use mock AI responses when true
  ai: !env.OPENAI_API_KEY || isDevelopment,
  
  // Use mock Shopify data when true  
  shopify: !env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_STOREFRONT_TOKEN || isDevelopment,
  
  // Use mock payment processing when true
  payments: isDevelopment,
  
  // Use mock database when true
  database: isDevelopment,
}

// Validation helpers
export function validateEnv() {
  const missing: string[] = []
  
  if (!isMockMode.ai && !env.OPENAI_API_KEY) {
    missing.push('OPENAI_API_KEY')
  }
  
  if (!isMockMode.shopify) {
    if (!env.SHOPIFY_STORE_DOMAIN) missing.push('SHOPIFY_STORE_DOMAIN')
    if (!env.SHOPIFY_STOREFRONT_TOKEN) missing.push('SHOPIFY_STOREFRONT_TOKEN')
  }
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing.join(', '))
    console.warn('Running in mock mode for missing services')
  }
  
  return missing.length === 0
}

// Initialize validation on import
validateEnv()

export default env
