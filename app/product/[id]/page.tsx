import { notFound } from "next/navigation"
import { mockProducts } from "@/lib/mock-data"
import { ProductDetails } from "@/components/product-details"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = mockProducts.find((p) => p.id === params.id)

  if (!product) {
    notFound()
  }

  return <ProductDetails product={product} />
}

export function generateStaticParams() {
  return mockProducts.map((product) => ({
    id: product.id,
  }))
}
