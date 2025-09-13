import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isMockMode } from "@/lib/env"
import { mockProducts } from "@/lib/mock-data"

const searchFiltersSchema = z.object({
  keywords: z.array(z.string()),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  mustHaveTags: z.array(z.string()),
  excludeTags: z.array(z.string()),
  materials: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const filters = searchFiltersSchema.parse(body)

    if (isMockMode.shopify) {
      // Mock Shopify search - filter mock products
      let filtered = mockProducts

      // Filter by keywords
      if (filters.keywords.length > 0) {
        filtered = filtered.filter((product) =>
          filters.keywords.some(
            (keyword) =>
              product.title.toLowerCase().includes(keyword.toLowerCase()) ||
              product.tags.some((tag) => tag.toLowerCase().includes(keyword.toLowerCase())),
          ),
        )
      }

      // Filter by price range
      if (filters.priceMin) {
        filtered = filtered.filter((product) => product.price >= filters.priceMin!)
      }
      if (filters.priceMax) {
        filtered = filtered.filter((product) => product.price <= filters.priceMax!)
      }

      // Filter by required tags
      if (filters.mustHaveTags.length > 0) {
        filtered = filtered.filter((product) =>
          filters.mustHaveTags.every((tag) =>
            product.tags.some((productTag) => productTag.toLowerCase().includes(tag.toLowerCase())),
          ),
        )
      }

      // Exclude products with certain tags
      if (filters.excludeTags.length > 0) {
        filtered = filtered.filter(
          (product) =>
            !filters.excludeTags.some((tag) =>
              product.tags.some((productTag) => productTag.toLowerCase().includes(tag.toLowerCase())),
            ),
        )
      }

      return NextResponse.json(filtered)
    }

    // TODO: Implement real Shopify Storefront API search
    // const shopifyQuery = `
    //   query searchProducts($query: String!, $first: Int!) {
    //     products(query: $query, first: $first) {
    //       edges {
    //         node {
    //           id
    //           title
    //           vendor
    //           tags
    //           priceRange {
    //             minVariantPrice {
    //               amount
    //               currencyCode
    //             }
    //           }
    //           images(first: 1) {
    //             edges {
    //               node {
    //                 url
    //                 altText
    //               }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // `

    // const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-Shopify-Storefront-Access-Token': env.SHOPIFY_STOREFRONT_TOKEN!,
    //   },
    //   body: JSON.stringify({
    //     query: shopifyQuery,
    //     variables: {
    //       query: filters.keywords.join(' '),
    //       first: 50,
    //     },
    //   }),
    // })

    // Fallback to mock data
    return NextResponse.json(mockProducts)
  } catch (error) {
    console.error("Shopify search error:", error)
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 })
  }
}
