export interface Product {
  id: string
  title: string
  price: number
  vendor: string
  tags: string[]
  image: string
  rating: number
  category: string
}

export const mockProducts: Product[] = [
  // Existing products
  {
    id: "1",
    title: "Wireless Bluetooth Headphones",
    price: 7999,
    vendor: "AudioTech",
    tags: ["wireless", "bluetooth", "audio", "headphones"],
    image: "/wireless-headphones.png",
    rating: 4.5,
    category: "Electronics"
  },
  {
    id: "2", 
    title: "Smart Water Bottle with Temperature Display",
    price: 4999,
    vendor: "HydroSmart",
    tags: ["smart", "water", "bottle", "temperature", "display"],
    image: "/smart-water-bottle.jpg",
    rating: 4.2,
    category: "Health"
  },
  {
    id: "3",
    title: "Ergonomic Office Chair",
    price: 29999,
    vendor: "ComfortSeating",
    tags: ["ergonomic", "office", "chair", "comfort"],
    image: "/ergonomic-office-chair.png", 
    rating: 4.7,
    category: "Furniture"
  },
  {
    id: "4",
    title: "Waterproof Laptop Backpack",
    price: 8999,
    vendor: "TechCarry",
    tags: ["waterproof", "laptop", "backpack", "travel"],
    image: "/waterproof-laptop-backpack.png",
    rating: 4.3,
    category: "Accessories"
  },
  // Mining and Diamond products
  {
    id: "mining-1",
    title: "Professional Diamond Mining Equipment Kit",
    price: 299999,
    vendor: "MinerPro",
    tags: ["diamond", "mining", "equipment", "professional", "kit", "gems"],
    image: "/placeholder.svg",
    rating: 4.8,
    category: "Mining Equipment"
  },
  {
    id: "mining-2", 
    title: "Digital Diamond Detector Scanner",
    price: 89999,
    vendor: "GemTech",
    tags: ["diamond", "detector", "scanner", "digital", "gems", "mining"],
    image: "/placeholder.svg",
    rating: 4.6,
    category: "Mining Equipment"
  },
  {
    id: "mining-3",
    title: "Industrial Diamond Drill Bit Set",
    price: 15999,
    vendor: "DrillMaster",
    tags: ["diamond", "drill", "industrial", "mining", "tools", "cutting"],
    image: "/placeholder.svg", 
    rating: 4.4,
    category: "Mining Tools"
  },
  {
    id: "mining-4",
    title: "Miner's Safety Helmet with LED Light",
    price: 12999,
    vendor: "SafetyFirst",
    tags: ["mining", "safety", "helmet", "led", "light", "protection"],
    image: "/placeholder.svg",
    rating: 4.7,
    category: "Safety Equipment"
  },
  {
    id: "mining-5",
    title: "Portable Gold & Diamond Panning Kit",
    price: 5999,
    vendor: "PanMaster",
    tags: ["gold", "diamond", "panning", "portable", "kit", "mining"],
    image: "/placeholder.svg",
    rating: 4.2,
    category: "Mining Equipment"
  },
  {
    id: "mining-6",
    title: "Diamond Clarity Grading Loupe",
    price: 7999,
    vendor: "GemScope",
    tags: ["diamond", "clarity", "grading", "loupe", "gems", "appraisal"],
    image: "/placeholder.svg",
    rating: 4.9,
    category: "Gem Tools"
  },
  {
    id: "mining-7",
    title: "Heavy-Duty Mining Boots",
    price: 18999,
    vendor: "ToughStep",
    tags: ["mining", "boots", "heavy-duty", "safety", "protection"],
    image: "/placeholder.svg",
    rating: 4.5,
    category: "Safety Equipment"
  },
  {
    id: "mining-8",
    title: "Diamond Cutting and Polishing Machine",
    price: 199999,
    vendor: "PrecisionCraft",
    tags: ["diamond", "cutting", "polishing", "machine", "precision", "gems"],
    image: "/placeholder.svg",
    rating: 4.8,
    category: "Processing Equipment"
  }
]

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  items: Array<{
    productId: string
    title: string
    price: number
    quantity: number
    image: string
  }>
  totalAmount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: 'sol' | 'usdc' | 'card'
  createdAt: string
  updatedAt: string
  shippingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

export const mockOrders: Order[] = [
  {
    id: "order_1",
    customerId: "customer_1",
    customerName: "John Doe",
    customerEmail: "john.doe@example.com",
    items: [
      {
        productId: "mining-1",
        title: "Professional Diamond Mining Equipment Kit",
        price: 299999,
        quantity: 1,
        image: "/placeholder.svg"
      }
    ],
    totalAmount: 299999,
    status: "confirmed",
    paymentMethod: "sol",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    shippingAddress: {
      street: "123 Mining St",
      city: "Denver",
      state: "CO",
      zipCode: "80201",
      country: "USA"
    }
  },
  {
    id: "order_2",
    customerId: "customer_2", 
    customerName: "Jane Smith",
    customerEmail: "jane.smith@example.com",
    items: [
      {
        productId: "2",
        title: "Smart Water Bottle with Temperature Display",
        price: 4999,
        quantity: 2,
        image: "/smart-water-bottle.jpg"
      },
      {
        productId: "1",
        title: "Wireless Bluetooth Headphones",
        price: 7999,
        quantity: 1,
        image: "/wireless-headphones.png"
      }
    ],
    totalAmount: 17997,
    status: "shipped",
    paymentMethod: "usdc",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "order_3",
    customerId: "customer_3",
    customerName: "Mike Johnson", 
    customerEmail: "mike.johnson@example.com",
    items: [
      {
        productId: "mining-2",
        title: "Digital Diamond Detector Scanner",
        price: 89999,
        quantity: 1,
        image: "/placeholder.svg"
      },
      {
        productId: "mining-4",
        title: "Miner's Safety Helmet with LED Light",
        price: 12999,
        quantity: 1,
        image: "/placeholder.svg"
      }
    ],
    totalAmount: 102998,
    status: "delivered",
    paymentMethod: "sol",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: "order_4",
    customerId: "customer_4",
    customerName: "Sarah Wilson",
    customerEmail: "sarah.wilson@example.com", 
    items: [
      {
        productId: "3",
        title: "Ergonomic Office Chair",
        price: 29999,
        quantity: 1,
        image: "/ergonomic-office-chair.png"
      }
    ],
    totalAmount: 29999,
    status: "pending",
    paymentMethod: "card",
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString()
  }
]
