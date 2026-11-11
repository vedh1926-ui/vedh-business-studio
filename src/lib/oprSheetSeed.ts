import {
  InventoryItem,
  Order,
  Payment,
  Product,
  RecipeIngredient,
  StockAdjustment,
} from './types';

// Auto-generated from products_and_recipies.xlsx + Purchase Sheet unit costs
export const initialSheetProducts: Product[] = [
  {
    "id": "prod-sheet-01",
    "name": "Any",
    "category": "Diyas",
    "collection": "Custom Assorted",
    "price": 300,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-02",
    "name": "Any Flower",
    "category": "Diyas",
    "collection": "Custom Assorted",
    "price": 300,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-03",
    "name": "Any Petal Lotus",
    "category": "Diyas",
    "collection": "Custom Assorted",
    "price": 300,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-04",
    "name": "Any SeaShells",
    "category": "Diyas",
    "collection": "Custom Assorted",
    "price": 350,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-05",
    "name": "Any Zari Fabric",
    "category": "Diyas",
    "collection": "Custom Assorted",
    "price": 300,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-06",
    "name": "Diwali Hamper – Small",
    "category": "Festive Hampers",
    "collection": "Diwali Hamper",
    "price": 100,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-07",
    "name": "Fabric Theme Diya (Set of 2) BLUE",
    "category": "Diyas",
    "collection": "Fabric Theme Diya",
    "price": 175,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-08",
    "name": "Fabric Theme Diya (Set of 2) CREAM",
    "category": "Diyas",
    "collection": "Fabric Theme Diya",
    "price": 175,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-09",
    "name": "Fabric Theme Diya (Set of 2) PINK",
    "category": "Diyas",
    "collection": "Fabric Theme Diya",
    "price": 175,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-10",
    "name": "Fabric Theme Diya (Set of 2) PURPLE",
    "category": "Diyas",
    "collection": "Fabric Theme Diya",
    "price": 175,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-11",
    "name": "Hand-painted terracotta Diya (Set of 2) - box pack",
    "category": "Diyas",
    "collection": "Hand-painted Terracotta Diya",
    "price": 150,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-12",
    "name": "Hand-painted terracotta Diya (Set of 2) - gift pack",
    "category": "Diyas",
    "collection": "Hand-painted Terracotta Diya",
    "price": 175,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-13",
    "name": "Hand-painted terracotta Diya (Set of 3)",
    "category": "Diyas",
    "collection": "Hand-painted Terracotta Diya",
    "price": 150,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-14",
    "name": "Hand-painted terracotta Diya (Set of 4)",
    "category": "Diyas",
    "collection": "Hand-painted Terracotta Diya",
    "price": 275,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-15",
    "name": "Lotus Petals Diya (Set of 2) BLUE",
    "category": "Diyas",
    "collection": "Lotus Petals Diya",
    "price": 300,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-16",
    "name": "Lotus Petals Diya (Set of 2) GOLD",
    "category": "Diyas",
    "collection": "Lotus Petals Diya",
    "price": 300,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-17",
    "name": "Lotus Petals Diya (Set of 2) PINK",
    "category": "Diyas",
    "collection": "Lotus Petals Diya",
    "price": 300,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-18",
    "name": "Lotus Petals Diya (Set of 2) PINK BLUE MULTI",
    "category": "Diyas",
    "collection": "Lotus Petals Diya",
    "price": 300,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-19",
    "name": "Metal Gold Flower Craved URLI Bowl",
    "category": "Home Decor",
    "collection": "Pooja & Urli",
    "price": 400,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-20",
    "name": "Pearls and Flower diya (Set of 2) BLUE GREEN",
    "category": "Diyas",
    "collection": "Pearls and Flower Diya",
    "price": 250,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-21",
    "name": "Pearls and Flower diya (Set of 2) GOLD",
    "category": "Diyas",
    "collection": "Pearls and Flower Diya",
    "price": 250,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-22",
    "name": "Pearls and Flower diya (Set of 2) PINK",
    "category": "Diyas",
    "collection": "Pearls and Flower Diya",
    "price": 250,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-23",
    "name": "Pearls and Flower diya (Set of 2) RED",
    "category": "Diyas",
    "collection": "Pearls and Flower Diya",
    "price": 250,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-24",
    "name": "Shells two layers (Set of 2) GOLD",
    "category": "Diyas",
    "collection": "Shells Two Layers",
    "price": 350,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-25",
    "name": "Shells two layers (Set of 2) PINK",
    "category": "Diyas",
    "collection": "Shells Two Layers",
    "price": 350,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-26",
    "name": "Shells two layers (Set of 2) SEA BLUE GREEN",
    "category": "Diyas",
    "collection": "Shells Two Layers",
    "price": 350,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-27",
    "name": "Zari Bloom COBALT BLUE n cream candle",
    "category": "Diyas",
    "collection": "Zari Bloom",
    "price": 300,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-28",
    "name": "Zari Bloom NAVY BLUE n Pink Candle",
    "category": "Diyas",
    "collection": "Zari Bloom",
    "price": 300,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-29",
    "name": "Zari Bloom PEACH",
    "category": "Diyas",
    "collection": "Zari Bloom",
    "price": 300,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-30",
    "name": "Zari Bloom PINK",
    "category": "Diyas",
    "collection": "Zari Bloom",
    "price": 300,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  },
  {
    "id": "prod-sheet-31",
    "name": "Short GLASS mirror-lace GOLD (Carmine Candle)",
    "category": "Candles",
    "collection": "GLASS",
    "price": 350,
    "estimatedCost": 0,
    "stock": 0,
    "unit": "set",
    "reorderLevel": 5,
    "status": "Healthy"
  }
];

export const initialSheetOrders: Order[] = [
  {
    "id": "ord-sheet-001",
    "orderNumber": "ORD-001",
    "customerName": "Deepti- Kalyani",
    "items": [
      {
        "productId": "prod-sheet-05",
        "productName": "Any Zari Fabric",
        "quantity": 4,
        "unitPrice": 300
      }
    ],
    "totalAmount": 1200,
    "advancePaid": 0,
    "balanceDue": 1200,
    "status": "Delivered",
    "createdAt": "2026-10-28",
    "targetDeliveryDate": "2026-11-09",
    "deliveredOn": "2026-11-06",
    "deductStock": false
  },
  {
    "id": "ord-sheet-002",
    "orderNumber": "ORD-001",
    "customerName": "Deepti- Kalyani",
    "items": [
      {
        "productId": "prod-sheet-26",
        "productName": "Shells two layers (Set of 2) SEA BLUE GREEN",
        "quantity": 1,
        "unitPrice": 350
      }
    ],
    "totalAmount": 350,
    "advancePaid": 0,
    "balanceDue": 350,
    "status": "Delivered",
    "createdAt": "2026-10-28",
    "targetDeliveryDate": "2026-11-09",
    "deliveredOn": "2026-11-06",
    "deductStock": false
  },
  {
    "id": "ord-sheet-003",
    "orderNumber": "ORD-001",
    "customerName": "Deepti- Kalyani",
    "items": [
      {
        "productId": "prod-sheet-15",
        "productName": "Lotus Petals Diya (Set of 2) BLUE",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 0,
    "balanceDue": 300,
    "status": "Delivered",
    "createdAt": "2026-10-28",
    "targetDeliveryDate": "2026-11-09",
    "deliveredOn": "2026-11-06",
    "deductStock": false
  },
  {
    "id": "ord-sheet-004",
    "orderNumber": "ORD-001",
    "customerName": "Deepti- Kalyani",
    "items": [
      {
        "productId": "prod-sheet-16",
        "productName": "Lotus Petals Diya (Set of 2) GOLD",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 0,
    "balanceDue": 300,
    "status": "Delivered",
    "createdAt": "2026-10-28",
    "targetDeliveryDate": "2026-11-09",
    "deliveredOn": "2026-11-06",
    "deductStock": false
  },
  {
    "id": "ord-sheet-005",
    "orderNumber": "ORD-001",
    "customerName": "Deepti- Kalyani",
    "items": [
      {
        "productId": "prod-sheet-17",
        "productName": "Lotus Petals Diya (Set of 2) PINK",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 0,
    "balanceDue": 300,
    "status": "Delivered",
    "createdAt": "2026-10-28",
    "targetDeliveryDate": "2026-11-09",
    "deliveredOn": "2026-11-06",
    "deductStock": false
  },
  {
    "id": "ord-sheet-006",
    "orderNumber": "ORD-002",
    "customerName": "Vasanta",
    "items": [
      {
        "productId": "prod-sheet-17",
        "productName": "Lotus Petals Diya (Set of 2) PINK",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 0,
    "balanceDue": 300,
    "status": "Ready",
    "createdAt": "2026-10-29",
    "targetDeliveryDate": "2026-11-11",
    "deductStock": false
  },
  {
    "id": "ord-sheet-007",
    "orderNumber": "ORD-003",
    "customerName": "Sandhya amma frnd",
    "items": [
      {
        "productId": "prod-sheet-17",
        "productName": "Lotus Petals Diya (Set of 2) PINK",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-10-29",
    "targetDeliveryDate": "2026-11-06",
    "deductStock": false,
    "notes": "Not urgent"
  },
  {
    "id": "ord-sheet-008",
    "orderNumber": "ORD-003",
    "customerName": "Sandhya amma frnd",
    "items": [
      {
        "productId": "prod-sheet-18",
        "productName": "Lotus Petals Diya (Set of 2) PINK BLUE MULTI",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-10-29",
    "targetDeliveryDate": "2026-11-06",
    "deductStock": false
  },
  {
    "id": "ord-sheet-009",
    "orderNumber": "ORD-003",
    "customerName": "Sandhya amma frnd",
    "items": [
      {
        "productId": "prod-sheet-26",
        "productName": "Shells two layers (Set of 2) SEA BLUE GREEN",
        "quantity": 1,
        "unitPrice": 350
      }
    ],
    "totalAmount": 350,
    "advancePaid": 350,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-10-29",
    "targetDeliveryDate": "2026-11-06",
    "deductStock": false
  },
  {
    "id": "ord-sheet-010",
    "orderNumber": "ORD-003",
    "customerName": "Sandhya amma frnd",
    "items": [
      {
        "productId": "prod-sheet-20",
        "productName": "Pearls and Flower diya (Set of 2) BLUE GREEN",
        "quantity": 1,
        "unitPrice": 250
      }
    ],
    "totalAmount": 250,
    "advancePaid": 250,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-10-29",
    "targetDeliveryDate": "2026-11-06",
    "deductStock": false
  },
  {
    "id": "ord-sheet-011",
    "orderNumber": "ORD-003",
    "customerName": "Sandhya amma frnd",
    "items": [
      {
        "productId": "prod-sheet-28",
        "productName": "Zari Bloom NAVY BLUE n Pink Candle",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-10-29",
    "targetDeliveryDate": "2026-11-06",
    "deductStock": false
  },
  {
    "id": "ord-sheet-012",
    "orderNumber": "ORD-003",
    "customerName": "Sandhya amma frnd",
    "items": [
      {
        "productId": "prod-sheet-29",
        "productName": "Zari Bloom PEACH",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-10-29",
    "targetDeliveryDate": "2026-11-06",
    "deductStock": false
  },
  {
    "id": "ord-sheet-013",
    "orderNumber": "ORD-004",
    "customerName": "Venkata RamanaReddy Sir",
    "items": [
      {
        "productId": "prod-sheet-27",
        "productName": "Zari Bloom COBALT BLUE n cream candle",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 0,
    "balanceDue": 300,
    "status": "New",
    "createdAt": "2026-10-31",
    "targetDeliveryDate": "2026-11-15",
    "deductStock": true
  },
  {
    "id": "ord-sheet-014",
    "orderNumber": "ORD-005",
    "customerName": "SuryaKumari Maam",
    "items": [
      {
        "productId": "prod-sheet-30",
        "productName": "Zari Bloom PINK",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 0,
    "balanceDue": 300,
    "status": "New",
    "createdAt": "2026-10-31",
    "targetDeliveryDate": "2026-11-15",
    "deductStock": true
  },
  {
    "id": "ord-sheet-015",
    "orderNumber": "ORD-006",
    "customerName": "Ballu Baabu",
    "items": [
      {
        "productId": "prod-sheet-27",
        "productName": "Zari Bloom COBALT BLUE n cream candle",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-10-31",
    "targetDeliveryDate": "2026-11-05",
    "deliveredOn": "2026-11-02",
    "deductStock": false
  },
  {
    "id": "ord-sheet-016",
    "orderNumber": "ORD-007",
    "customerName": "Deepak Bagra I1604",
    "items": [
      {
        "productId": "prod-sheet-30",
        "productName": "Zari Bloom PINK",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 0,
    "balanceDue": 300,
    "status": "New",
    "createdAt": "2026-10-31",
    "targetDeliveryDate": "2026-11-15",
    "deductStock": true
  },
  {
    "id": "ord-sheet-017",
    "orderNumber": "ORD-008",
    "customerName": "Madhulika Reddy",
    "items": [
      {
        "productId": "prod-sheet-28",
        "productName": "Zari Bloom NAVY BLUE n Pink Candle",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 0,
    "balanceDue": 300,
    "status": "New",
    "createdAt": "2026-10-31",
    "targetDeliveryDate": "2026-11-15",
    "deductStock": true
  },
  {
    "id": "ord-sheet-018",
    "orderNumber": "ORD-009",
    "customerName": "Sulima E1801 Grande",
    "items": [
      {
        "productId": "prod-sheet-16",
        "productName": "Lotus Petals Diya (Set of 2) GOLD",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-01",
    "targetDeliveryDate": "2026-11-05",
    "deliveredOn": "2026-11-05",
    "deductStock": false
  },
  {
    "id": "ord-sheet-019",
    "orderNumber": "ORD-009",
    "customerName": "Sulima E1801 Grande",
    "items": [
      {
        "productId": "prod-sheet-24",
        "productName": "Shells two layers (Set of 2) GOLD",
        "quantity": 1,
        "unitPrice": 350
      }
    ],
    "totalAmount": 350,
    "advancePaid": 350,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-01",
    "targetDeliveryDate": "2026-11-05",
    "deliveredOn": "2026-11-05",
    "deductStock": false
  },
  {
    "id": "ord-sheet-020",
    "orderNumber": "ORD-009",
    "customerName": "Sulima E1801 Grande",
    "items": [
      {
        "productId": "prod-sheet-29",
        "productName": "Zari Bloom PEACH",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-01",
    "targetDeliveryDate": "2026-11-05",
    "deliveredOn": "2026-11-05",
    "deductStock": false
  },
  {
    "id": "ord-sheet-021",
    "orderNumber": "ORD-011",
    "customerName": "Gavrav singhal ( appu ref)",
    "items": [
      {
        "productId": "prod-sheet-16",
        "productName": "Lotus Petals Diya (Set of 2) GOLD",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-01",
    "targetDeliveryDate": "2026-11-03",
    "deliveredOn": "2026-11-03",
    "deductStock": false,
    "notes": "Deliver ASAP, Address : 2025 , Tower 2, 2nd floor, Prestige Beverly Hills, Kokapet"
  },
  {
    "id": "ord-sheet-022",
    "orderNumber": "ORD-013",
    "customerName": "Malasian Township M.Prem",
    "items": [
      {
        "productId": "prod-sheet-16",
        "productName": "Lotus Petals Diya (Set of 2) GOLD",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-01",
    "targetDeliveryDate": "2026-11-02",
    "deliveredOn": "2026-11-02",
    "deductStock": false
  },
  {
    "id": "ord-sheet-023",
    "orderNumber": "ORD-013",
    "customerName": "Malasian Township M.Prem",
    "items": [
      {
        "productId": "prod-sheet-30",
        "productName": "Zari Bloom PINK",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-01",
    "targetDeliveryDate": "2026-11-02",
    "deliveredOn": "2026-11-02",
    "deductStock": false
  },
  {
    "id": "ord-sheet-024",
    "orderNumber": "ORD-013",
    "customerName": "Malasian Township M.Prem",
    "items": [
      {
        "productId": "prod-sheet-28",
        "productName": "Zari Bloom NAVY BLUE n Pink Candle",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-01",
    "targetDeliveryDate": "2026-11-02",
    "deliveredOn": "2026-11-02",
    "deductStock": false
  },
  {
    "id": "ord-sheet-025",
    "orderNumber": "ORD-014",
    "customerName": "Aparna",
    "items": [
      {
        "productId": "prod-sheet-28",
        "productName": "Zari Bloom NAVY BLUE n Pink Candle",
        "quantity": 3,
        "unitPrice": 300
      }
    ],
    "totalAmount": 900,
    "advancePaid": 900,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-02",
    "targetDeliveryDate": "2026-11-03",
    "deliveredOn": "2026-11-03",
    "deductStock": false
  },
  {
    "id": "ord-sheet-026",
    "orderNumber": "ORD-015",
    "customerName": "Malasian Township M.Prem",
    "items": [
      {
        "productId": "prod-sheet-03",
        "productName": "Any Petal Lotus",
        "quantity": 10,
        "unitPrice": 300
      }
    ],
    "totalAmount": 3000,
    "advancePaid": 0,
    "balanceDue": 3000,
    "status": "Delivered",
    "createdAt": "2026-11-02",
    "targetDeliveryDate": "2026-11-05",
    "deliveredOn": "2026-11-05",
    "deductStock": false
  },
  {
    "id": "ord-sheet-027",
    "orderNumber": "ORD-015",
    "customerName": "Malasian Township M.Prem",
    "items": [
      {
        "productId": "prod-sheet-02",
        "productName": "Any Flower",
        "quantity": 5,
        "unitPrice": 300
      }
    ],
    "totalAmount": 1500,
    "advancePaid": 0,
    "balanceDue": 1500,
    "status": "Delivered",
    "createdAt": "2026-11-02",
    "targetDeliveryDate": "2026-11-05",
    "deliveredOn": "2026-11-05",
    "deductStock": false
  },
  {
    "id": "ord-sheet-028",
    "orderNumber": "ORD-015",
    "customerName": "Malasian Township M.Prem",
    "items": [
      {
        "productId": "prod-sheet-05",
        "productName": "Any Zari Fabric",
        "quantity": 5,
        "unitPrice": 300
      }
    ],
    "totalAmount": 1500,
    "advancePaid": 0,
    "balanceDue": 1500,
    "status": "Delivered",
    "createdAt": "2026-11-02",
    "targetDeliveryDate": "2026-11-05",
    "deliveredOn": "2026-11-05",
    "deductStock": false
  },
  {
    "id": "ord-sheet-029",
    "orderNumber": "ORD-016",
    "customerName": "Aparna",
    "items": [
      {
        "productId": "prod-sheet-02",
        "productName": "Any Flower",
        "quantity": 5,
        "unitPrice": 300
      }
    ],
    "totalAmount": 1500,
    "advancePaid": 1500,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-03",
    "targetDeliveryDate": "2026-11-05",
    "deliveredOn": "2026-11-04",
    "deductStock": false
  },
  {
    "id": "ord-sheet-030",
    "orderNumber": "ORD-016",
    "customerName": "Aparna",
    "items": [
      {
        "productId": "prod-sheet-02",
        "productName": "Any Flower",
        "quantity": 2,
        "unitPrice": 300
      }
    ],
    "totalAmount": 600,
    "advancePaid": 600,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-03",
    "targetDeliveryDate": "2026-11-05",
    "deliveredOn": "2026-11-04",
    "deductStock": false
  },
  {
    "id": "ord-sheet-031",
    "orderNumber": "ORD-017",
    "customerName": "Aravind",
    "items": [
      {
        "productId": "prod-sheet-28",
        "productName": "Zari Bloom NAVY BLUE n Pink Candle",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-03",
    "targetDeliveryDate": "2026-11-04",
    "deliveredOn": "2026-11-04",
    "deductStock": false
  },
  {
    "id": "ord-sheet-032",
    "orderNumber": "ORD-017",
    "customerName": "Aravind",
    "items": [
      {
        "productId": "prod-sheet-02",
        "productName": "Any Flower",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-03",
    "targetDeliveryDate": "2026-11-04",
    "deliveredOn": "2026-11-04",
    "deductStock": false
  },
  {
    "id": "ord-sheet-033",
    "orderNumber": "ORD-017",
    "customerName": "Aravind",
    "items": [
      {
        "productId": "prod-sheet-24",
        "productName": "Shells two layers (Set of 2) GOLD",
        "quantity": 1,
        "unitPrice": 350
      }
    ],
    "totalAmount": 350,
    "advancePaid": 350,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-03",
    "targetDeliveryDate": "2026-11-04",
    "deliveredOn": "2026-11-04",
    "deductStock": false
  },
  {
    "id": "ord-sheet-034",
    "orderNumber": "ORD-018",
    "customerName": "Apoorva H1701",
    "items": [
      {
        "productId": "prod-sheet-03",
        "productName": "Any Petal Lotus",
        "quantity": 4,
        "unitPrice": 300
      }
    ],
    "totalAmount": 1200,
    "advancePaid": 0,
    "balanceDue": 1200,
    "status": "Ready",
    "createdAt": "2026-11-03",
    "targetDeliveryDate": "2026-11-11",
    "deductStock": false
  },
  {
    "id": "ord-sheet-035",
    "orderNumber": "ORD-018",
    "customerName": "Apoorva H1701",
    "items": [
      {
        "productId": "prod-sheet-03",
        "productName": "Any Petal Lotus",
        "quantity": 8,
        "unitPrice": 300
      }
    ],
    "totalAmount": 2400,
    "advancePaid": 0,
    "balanceDue": 2400,
    "status": "In Production",
    "createdAt": "2026-11-03",
    "targetDeliveryDate": "2026-12-05",
    "deductStock": false
  },
  {
    "id": "ord-sheet-036",
    "orderNumber": "ORD-019",
    "customerName": "Tumpa D1703",
    "items": [
      {
        "productId": "prod-sheet-15",
        "productName": "Lotus Petals Diya (Set of 2) BLUE",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-03",
    "targetDeliveryDate": "2026-11-07",
    "deductStock": false
  },
  {
    "id": "ord-sheet-037",
    "orderNumber": "ORD-019",
    "customerName": "Tumpa D1703",
    "items": [
      {
        "productId": "prod-sheet-16",
        "productName": "Lotus Petals Diya (Set of 2) GOLD",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-03",
    "targetDeliveryDate": "2026-11-07",
    "deductStock": false
  },
  {
    "id": "ord-sheet-038",
    "orderNumber": "ORD-020",
    "customerName": "Padmini C202",
    "items": [
      {
        "productId": "prod-sheet-24",
        "productName": "Shells two layers (Set of 2) GOLD",
        "quantity": 1,
        "unitPrice": 350
      }
    ],
    "totalAmount": 350,
    "advancePaid": 0,
    "balanceDue": 350,
    "status": "Delivered",
    "createdAt": "2026-11-03",
    "targetDeliveryDate": "2026-11-07",
    "deductStock": false
  },
  {
    "id": "ord-sheet-039",
    "orderNumber": "ORD-020",
    "customerName": "Padmini C202",
    "items": [
      {
        "productId": "prod-sheet-16",
        "productName": "Lotus Petals Diya (Set of 2) GOLD",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 0,
    "balanceDue": 300,
    "status": "Delivered",
    "createdAt": "2026-11-03",
    "targetDeliveryDate": "2026-11-07",
    "deductStock": false
  },
  {
    "id": "ord-sheet-040",
    "orderNumber": "ORD-019",
    "customerName": "Deepti Mehta",
    "customerPhone": "9848481203",
    "items": [
      {
        "productId": "prod-sheet-27",
        "productName": "Zari Bloom COBALT BLUE n cream candle",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-04",
    "targetDeliveryDate": "2026-11-04",
    "deductStock": false
  },
  {
    "id": "ord-sheet-041",
    "orderNumber": "ORD-019",
    "customerName": "Aparna Manager Metal",
    "items": [
      {
        "productId": "prod-sheet-19",
        "productName": "Metal Gold Flower Craved URLI Bowl",
        "quantity": 10,
        "unitPrice": 400
      }
    ],
    "totalAmount": 4000,
    "advancePaid": 0,
    "balanceDue": 4000,
    "status": "Delivered",
    "createdAt": "2026-11-04",
    "targetDeliveryDate": "2026-11-06",
    "deductStock": false
  },
  {
    "id": "ord-sheet-042",
    "orderNumber": "ORD-020",
    "customerName": "Sandhya amma frnd",
    "items": [
      {
        "productId": "prod-sheet-19",
        "productName": "Metal Gold Flower Craved URLI Bowl",
        "quantity": 2,
        "unitPrice": 400
      }
    ],
    "totalAmount": 800,
    "advancePaid": 800,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-05",
    "targetDeliveryDate": "2026-11-06",
    "deductStock": false
  },
  {
    "id": "ord-sheet-043",
    "orderNumber": "ORD-020",
    "customerName": "Padma Amma friend",
    "items": [
      {
        "productId": "prod-sheet-17",
        "productName": "Lotus Petals Diya (Set of 2) PINK",
        "quantity": 1,
        "unitPrice": 300
      }
    ],
    "totalAmount": 300,
    "advancePaid": 300,
    "balanceDue": 0,
    "status": "Delivered",
    "paymentMode": "UPI",
    "createdAt": "2026-11-05",
    "targetDeliveryDate": "2026-11-06",
    "deductStock": false
  }
];

// Clean deduplicated physical Stock Ledger (37 unique Excel Stock items + 1 added missing material 'Green flower candle' = 38 total)
export const initialSheetInventory: InventoryItem[] = [
  {
    "id": "inv-mat-20",
    "name": "3D outliner (pearl)",
    "type": "Raw Material",
    "category": "Art Supplies",
    "openingStock": null,
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 5,
    "purchaseSource": "Stock sheet — enter physical opening count",
    "status": "Critical"
  },
  {
    "id": "inv-mat-21",
    "name": "Adhesive B7000 50ml",
    "type": "Raw Material",
    "category": "Adhesives",
    "openingStock": 1,
    "stock": 1,
    "unit": "pcs",
    "reorderLevel": 2,
    "purchaseSource": "Physical shelf opening count: 1 pc",
    "status": "Low"
  },
  {
    "id": "inv-mat-17",
    "name": "Business Card",
    "type": "Packaging",
    "category": "Packaging",
    "openingStock": 15,
    "stock": 15,
    "unit": "pcs",
    "reorderLevel": 25,
    "purchaseSource": "Fixed typo ('Businesss Card') — Physical shelf opening count: 15 pcs",
    "status": "Low"
  },
  {
    "id": "inv-mat-03",
    "name": "Candle wick (3 inch)",
    "type": "Raw Material",
    "category": "Wax / Candles",
    "openingStock": 20,
    "stock": 20,
    "unit": "pcs",
    "reorderLevel": 30,
    "avgUnitCost": 1.74,
    "purchaseSource": "Physical shelf: 20 pcs | Purchases ref: Amazon Low Smoke Wicks + Just Kraft",
    "status": "Low",
    "supplier": "Amazon / Just Kraft"
  },
  {
    "id": "inv-mat-22",
    "name": "Glue Gun",
    "type": "Raw Material",
    "category": "Tools",
    "openingStock": 2,
    "stock": 2,
    "unit": "pcs",
    "reorderLevel": 1,
    "purchaseSource": "Trimmed trailing whitespace — Physical shelf opening count: 2 pcs",
    "status": "Healthy"
  },
  {
    "id": "inv-mat-07",
    "name": "Glue Sticks",
    "type": "Raw Material",
    "category": "Adhesives",
    "openingStock": 19,
    "stock": 19,
    "unit": "pcs",
    "reorderLevel": 10,
    "avgUnitCost": 9.53,
    "purchaseSource": "Physical shelf: 19 pcs | Amazon Themisto 11mm Hot Melt Glue Sticks (₹9.53/pc)",
    "status": "Healthy",
    "supplier": "Amazon"
  },
  {
    "id": "inv-mat-08",
    "name": "Gold gift box 12cm",
    "type": "Packaging",
    "category": "Packaging",
    "openingStock": 44,
    "stock": 44,
    "unit": "pcs",
    "reorderLevel": 15,
    "avgUnitCost": 23.4,
    "purchaseSource": "Physical shelf: 44 pcs | Amazon Divyakosh 12cm Gold Gift Boxes (₹23.40/pc)",
    "status": "Healthy",
    "supplier": "Amazon"
  },
  {
    "id": "inv-mat-23",
    "name": "Gold paint SPRAY can",
    "type": "Raw Material",
    "category": "Powders / Colours",
    "openingStock": 0,
    "stock": 0,
    "unit": "ml",
    "reorderLevel": 100,
    "purchaseSource": "Physical shelf opening count: 0 ml",
    "status": "Critical"
  },
  {
    "id": "inv-mat-14",
    "name": "Golden Paint",
    "type": "Raw Material",
    "category": "Powders / Colours",
    "openingStock": 100,
    "stock": 100,
    "unit": "ml",
    "reorderLevel": 25,
    "purchaseSource": "Physical shelf: 100 ml | Runicha Stationers High Coverage Gold Paint",
    "status": "Healthy",
    "supplier": "Runicha Stationers, Osmanganj"
  },
  {
    "id": "inv-mat-12",
    "name": "Green flower candle",
    "type": "Raw Material",
    "category": "Wax / Candles",
    "openingStock": null,
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 10,
    "purchaseSource": "Added from Recipe sheet ('Lotus Petals Diya PINK') — enter physical opening count",
    "status": "Critical"
  },
  {
    "id": "inv-mat-19",
    "name": "Lace Gold Semi-Circle Chip",
    "type": "Raw Material",
    "category": "Threads / Rolls",
    "openingStock": 213.5,
    "stock": 213.5,
    "unit": "inch",
    "reorderLevel": 50,
    "purchaseSource": "Physical shelf: 213.5 inch",
    "status": "Healthy"
  },
  {
    "id": "inv-mat-24",
    "name": "Lotus Petals BLUE Solid",
    "type": "Raw Material",
    "category": "Kundan / Stones / Beads",
    "openingStock": 178,
    "stock": 178,
    "unit": "pcs",
    "reorderLevel": 100,
    "purchaseSource": "Physical shelf: 178 pcs",
    "status": "Healthy"
  },
  {
    "id": "inv-mat-25",
    "name": "Lotus Petals BLUE Transparent",
    "type": "Raw Material",
    "category": "Kundan / Stones / Beads",
    "openingStock": 1222,
    "stock": 1222,
    "unit": "pcs",
    "reorderLevel": 150,
    "purchaseSource": "Fixed missing Unit ('pcs') & Category ('Kundan / Stones / Beads') — Shelf: 1,222 pcs",
    "status": "Healthy"
  },
  {
    "id": "inv-mat-11",
    "name": "Lotus Petals GOLD",
    "type": "Raw Material",
    "category": "Kundan / Stones / Beads",
    "openingStock": 274,
    "stock": 274,
    "unit": "pcs",
    "reorderLevel": 150,
    "purchaseSource": "Physical shelf: 274 pcs",
    "status": "Healthy"
  },
  {
    "id": "inv-mat-26",
    "name": "Lotus Petals MULTI",
    "type": "Raw Material",
    "category": "Kundan / Stones / Beads",
    "openingStock": 359,
    "stock": 359,
    "unit": "pcs",
    "reorderLevel": 100,
    "purchaseSource": "Physical shelf: 359 pcs",
    "status": "Healthy"
  },
  {
    "id": "inv-mat-27",
    "name": "Lotus Petals PINK Solid",
    "type": "Raw Material",
    "category": "Kundan / Stones / Beads",
    "openingStock": 447,
    "stock": 447,
    "unit": "pcs",
    "reorderLevel": 100,
    "purchaseSource": "Physical shelf: 447 pcs",
    "status": "Healthy"
  },
  {
    "id": "inv-mat-10",
    "name": "Lotus Petals PINK Transparent",
    "type": "Raw Material",
    "category": "Kundan / Stones / Beads",
    "openingStock": 1122,
    "stock": 1122,
    "unit": "pcs",
    "reorderLevel": 150,
    "purchaseSource": "Physical shelf: 1,122 pcs",
    "status": "Healthy"
  },
  {
    "id": "inv-mat-02",
    "name": "MDF round board 4in",
    "type": "Raw Material",
    "category": "Base Board / MDF",
    "openingStock": 0,
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 30,
    "avgUnitCost": 1.5,
    "purchaseSource": "Deduplicated (merged 2 Stock rows) | Shelf: 0 pcs + 150 Incoming (Meesho Shipped)",
    "status": "Critical",
    "supplier": "Meesho / NandiArts"
  },
  {
    "id": "inv-mat-01",
    "name": "Metal tealight holder (gold)",
    "type": "Raw Material",
    "category": "Metal Holders",
    "openingStock": 2,
    "stock": 2,
    "unit": "pcs",
    "reorderLevel": 20,
    "avgUnitCost": 10.32,
    "purchaseSource": "Physical shelf: 2 pcs + 60 Incoming (Meesho Shipped)",
    "status": "Low",
    "supplier": "Meesho / NandiArts / Amazon"
  },
  {
    "id": "inv-mat-28",
    "name": "Mica powder (gold)",
    "type": "Raw Material",
    "category": "Powders / Colours",
    "openingStock": null,
    "stock": 0,
    "unit": "g",
    "reorderLevel": 20,
    "purchaseSource": "Stock sheet — enter physical opening count (g)",
    "status": "Critical"
  },
  {
    "id": "inv-mat-29",
    "name": "Mold",
    "type": "Raw Material",
    "category": "Candle Moulds",
    "openingStock": null,
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 2,
    "purchaseSource": "Corrected Unit ('g' -> 'pcs') — enter physical opening count",
    "status": "Critical"
  },
  {
    "id": "inv-mat-30",
    "name": "Moti lace",
    "type": "Raw Material",
    "category": "Threads / Rolls",
    "openingStock": null,
    "stock": 0,
    "unit": "roll",
    "reorderLevel": 2,
    "purchaseSource": "Stock sheet — enter physical opening count (roll)",
    "status": "Critical"
  },
  {
    "id": "inv-mat-31",
    "name": "Net ribbon roll",
    "type": "Raw Material",
    "category": "Threads / Rolls",
    "openingStock": null,
    "stock": 0,
    "unit": "roll",
    "reorderLevel": 2,
    "purchaseSource": "Stock sheet — enter physical opening count (roll)",
    "status": "Critical"
  },
  {
    "id": "inv-mat-09",
    "name": "Packing grass",
    "type": "Packaging",
    "category": "Packaging",
    "openingStock": null,
    "stock": 0,
    "unit": "g",
    "reorderLevel": 100,
    "avgUnitCost": 0.3,
    "purchaseSource": "Stock sheet — enter physical opening count (g) | ₹0.30/g",
    "status": "Critical",
    "supplier": "Runicha Stationers, Osmanganj"
  },
  {
    "id": "inv-mat-06",
    "name": "Pearls 8mm",
    "type": "Raw Material",
    "category": "Kundan / Stones / Beads",
    "openingStock": null,
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 150,
    "avgUnitCost": 0.13,
    "purchaseSource": "Stock sheet — enter physical opening count | Amazon ₹0.13/pc",
    "status": "Critical",
    "supplier": "Amazon"
  },
  {
    "id": "inv-mat-13",
    "name": "Pink Colour Flower Candle",
    "type": "Raw Material",
    "category": "Wax / Candles",
    "openingStock": null,
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 10,
    "purchaseSource": "Stock sheet — enter physical opening count (pcs)",
    "status": "Critical"
  },
  {
    "id": "inv-mat-04",
    "name": "Plastic tealight cup (acrylic)",
    "type": "Raw Material",
    "category": "Candle Holders",
    "openingStock": 38,
    "stock": 38,
    "unit": "pcs",
    "reorderLevel": 25,
    "avgUnitCost": 9.7,
    "purchaseSource": "Physical shelf: 38 pcs | Just Kraft / Amazon ₹9.70/pc",
    "status": "Healthy",
    "supplier": "Just Kraft / Amazon"
  },
  {
    "id": "inv-mat-32",
    "name": "Round cupcake base",
    "type": "Raw Material",
    "category": "Base Board / MDF",
    "openingStock": null,
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 20,
    "purchaseSource": "Stock sheet — enter physical opening count (pcs)",
    "status": "Critical"
  },
  {
    "id": "inv-mat-16",
    "name": "Soy wax",
    "type": "Raw Material",
    "category": "Wax / Candles",
    "openingStock": 5500,
    "stock": 5500,
    "unit": "g",
    "reorderLevel": 500,
    "purchaseSource": "Physical shelf: 5,500 g",
    "status": "Healthy"
  },
  {
    "id": "inv-mat-05",
    "name": "Sticker for Wicks",
    "type": "Raw Material",
    "category": "Adhesives",
    "openingStock": 202,
    "stock": 202,
    "unit": "pcs",
    "reorderLevel": 40,
    "avgUnitCost": 0.9,
    "purchaseSource": "Unified with Recipe 'stickers' — Physical shelf: 202 pcs | Just Kraft ₹0.90/pc",
    "status": "Healthy",
    "supplier": "Just Kraft"
  },
  {
    "id": "inv-mat-33",
    "name": "Sweet box",
    "type": "Packaging",
    "category": "Packaging",
    "openingStock": null,
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 15,
    "purchaseSource": "Stock sheet — enter physical opening count (pcs)",
    "status": "Critical"
  },
  {
    "id": "inv-mat-34",
    "name": "Tassel roll",
    "type": "Raw Material",
    "category": "Threads / Rolls",
    "openingStock": null,
    "stock": 0,
    "unit": "roll",
    "reorderLevel": 2,
    "purchaseSource": "Stock sheet — enter physical opening count (roll)",
    "status": "Critical"
  },
  {
    "id": "inv-mat-18",
    "name": "Thankyou Sticker",
    "type": "Packaging",
    "category": "Packaging",
    "openingStock": null,
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 25,
    "purchaseSource": "Stock sheet — enter physical opening count (pcs)",
    "status": "Critical"
  },
  {
    "id": "inv-mat-35",
    "name": "Wax and Pigments",
    "type": "Raw Material",
    "category": "Wax / Candles",
    "openingStock": null,
    "stock": 0,
    "unit": "g",
    "reorderLevel": 100,
    "purchaseSource": "Stock sheet — enter physical opening count (g)",
    "status": "Critical"
  },
  {
    "id": "inv-mat-36",
    "name": "Wick sustainer tab",
    "type": "Raw Material",
    "category": "Art Supplies",
    "openingStock": 200,
    "stock": 200,
    "unit": "pcs",
    "reorderLevel": 40,
    "purchaseSource": "Physical shelf: 200 pcs",
    "status": "Healthy"
  },
  {
    "id": "inv-mat-37",
    "name": "Zari doori COPPER",
    "type": "Raw Material",
    "category": "Threads / Rolls",
    "openingStock": 1968,
    "stock": 1968,
    "unit": "inch",
    "reorderLevel": 100,
    "purchaseSource": "Physical shelf: 1,968 inch",
    "status": "Healthy"
  },
  {
    "id": "inv-mat-15",
    "name": "Zari doori GOLD",
    "type": "Raw Material",
    "category": "Threads / Rolls",
    "openingStock": 568,
    "stock": 568,
    "unit": "inch",
    "reorderLevel": 100,
    "purchaseSource": "Physical shelf: 568 inch (unit unified to inch matching Recipe)",
    "status": "Healthy"
  },
  {
    "id": "inv-mat-38",
    "name": "Zari doori SILVER",
    "type": "Raw Material",
    "category": "Threads / Rolls",
    "openingStock": 848,
    "stock": 848,
    "unit": "inch",
    "reorderLevel": 100,
    "purchaseSource": "Physical shelf: 848 inch",
    "status": "Healthy"
  }
];

export const initialSheetAdjustments: StockAdjustment[] = [];

export const initialSheetRecipes: RecipeIngredient[] = [
  {
    "id": "rec-sheet-001",
    "productId": "prod-sheet-17",
    "productName": "Lotus Petals Diya (Set of 2) PINK",
    "materialId": "inv-mat-10",
    "materialName": "Lotus Petals PINK Transparent",
    "qtyPerUnit": 30,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-002",
    "productId": "prod-sheet-17",
    "productName": "Lotus Petals Diya (Set of 2) PINK",
    "materialId": "inv-mat-01",
    "materialName": "Metal tealight holder (gold)",
    "qtyPerUnit": 1,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-003",
    "productId": "prod-sheet-17",
    "productName": "Lotus Petals Diya (Set of 2) PINK",
    "materialId": "inv-mat-03",
    "materialName": "Candle wick (3 inch)",
    "qtyPerUnit": 2,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-004",
    "productId": "prod-sheet-17",
    "productName": "Lotus Petals Diya (Set of 2) PINK",
    "materialId": "inv-mat-02",
    "materialName": "MDF round board 4in",
    "qtyPerUnit": 1,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-005",
    "productId": "prod-sheet-17",
    "productName": "Lotus Petals Diya (Set of 2) PINK",
    "materialId": "inv-mat-04",
    "materialName": "Plastic tealight cup (acrylic)",
    "qtyPerUnit": 1,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-006",
    "productId": "prod-sheet-17",
    "productName": "Lotus Petals Diya (Set of 2) PINK",
    "materialId": "inv-mat-12",
    "materialName": "Green flower candle",
    "qtyPerUnit": 1,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-007",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-01",
    "materialName": "Metal tealight holder (gold)",
    "qtyPerUnit": 2,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-008",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-11",
    "materialName": "Lotus Petals GOLD",
    "qtyPerUnit": 64,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-009",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-03",
    "materialName": "Candle wick (3 inch)",
    "qtyPerUnit": 2,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-010",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-05",
    "materialName": "Sticker for Wicks",
    "qtyPerUnit": 2,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-011",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-04",
    "materialName": "Plastic tealight cup (acrylic)",
    "qtyPerUnit": 2,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-012",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-02",
    "materialName": "MDF round board 4in",
    "qtyPerUnit": 2,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-013",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-06",
    "materialName": "Pearls 8mm",
    "qtyPerUnit": 26,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-014",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-14",
    "materialName": "Golden Paint",
    "qtyPerUnit": 5,
    "unit": "ml"
  },
  {
    "id": "rec-sheet-015",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-07",
    "materialName": "Glue Sticks",
    "qtyPerUnit": 1,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-016",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-15",
    "materialName": "Zari doori GOLD",
    "qtyPerUnit": 28,
    "unit": "inch"
  },
  {
    "id": "rec-sheet-017",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-16",
    "materialName": "Soy wax",
    "qtyPerUnit": 20,
    "unit": "g"
  },
  {
    "id": "rec-sheet-018",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-13",
    "materialName": "Pink Colour Flower Candle",
    "qtyPerUnit": 2,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-019",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-08",
    "materialName": "Gold gift box 12cm",
    "qtyPerUnit": 1,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-020",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-09",
    "materialName": "Packing grass",
    "qtyPerUnit": 5,
    "unit": "g"
  },
  {
    "id": "rec-sheet-021",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-17",
    "materialName": "Business Card",
    "qtyPerUnit": 1,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-022",
    "productId": "prod-sheet-16",
    "productName": "Lotus Petals Diya (Set of 2) GOLD",
    "materialId": "inv-mat-18",
    "materialName": "Thankyou Sticker",
    "qtyPerUnit": 1,
    "unit": "pcs"
  },
  {
    "id": "rec-sheet-023",
    "productId": "prod-sheet-31",
    "productName": "Short GLASS mirror-lace GOLD (Carmine Candle)",
    "materialId": "inv-mat-19",
    "materialName": "Lace Gold Semi-Circle Chip",
    "qtyPerUnit": 6.5,
    "unit": "inch"
  }
];

export const initialSheetPayments: Payment[] = [
  {
    "id": "pay-sheet-001",
    "orderNumber": "ORD-003",
    "customerName": "Sandhya amma frnd",
    "amount": 300,
    "date": "2026-10-29",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-002",
    "orderNumber": "ORD-003",
    "customerName": "Sandhya amma frnd",
    "amount": 300,
    "date": "2026-10-29",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-003",
    "orderNumber": "ORD-003",
    "customerName": "Sandhya amma frnd",
    "amount": 350,
    "date": "2026-10-29",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-004",
    "orderNumber": "ORD-003",
    "customerName": "Sandhya amma frnd",
    "amount": 250,
    "date": "2026-10-29",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-005",
    "orderNumber": "ORD-003",
    "customerName": "Sandhya amma frnd",
    "amount": 300,
    "date": "2026-10-29",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-006",
    "orderNumber": "ORD-003",
    "customerName": "Sandhya amma frnd",
    "amount": 300,
    "date": "2026-10-29",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-007",
    "orderNumber": "ORD-006",
    "customerName": "Ballu Baabu",
    "amount": 300,
    "date": "2026-11-02",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-008",
    "orderNumber": "ORD-009",
    "customerName": "Sulima E1801 Grande",
    "amount": 300,
    "date": "2026-11-05",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-009",
    "orderNumber": "ORD-009",
    "customerName": "Sulima E1801 Grande",
    "amount": 350,
    "date": "2026-11-05",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-010",
    "orderNumber": "ORD-009",
    "customerName": "Sulima E1801 Grande",
    "amount": 300,
    "date": "2026-11-05",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-011",
    "orderNumber": "ORD-011",
    "customerName": "Gavrav singhal ( appu ref)",
    "amount": 300,
    "date": "2026-11-03",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-012",
    "orderNumber": "ORD-013",
    "customerName": "Malasian Township M.Prem",
    "amount": 300,
    "date": "2026-11-02",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-013",
    "orderNumber": "ORD-013",
    "customerName": "Malasian Township M.Prem",
    "amount": 300,
    "date": "2026-11-02",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-014",
    "orderNumber": "ORD-013",
    "customerName": "Malasian Township M.Prem",
    "amount": 300,
    "date": "2026-11-02",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-015",
    "orderNumber": "ORD-014",
    "customerName": "Aparna",
    "amount": 900,
    "date": "2026-11-03",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-016",
    "orderNumber": "ORD-016",
    "customerName": "Aparna",
    "amount": 1500,
    "date": "2026-11-04",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-017",
    "orderNumber": "ORD-016",
    "customerName": "Aparna",
    "amount": 600,
    "date": "2026-11-04",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-018",
    "orderNumber": "ORD-017",
    "customerName": "Aravind",
    "amount": 300,
    "date": "2026-11-04",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-019",
    "orderNumber": "ORD-017",
    "customerName": "Aravind",
    "amount": 300,
    "date": "2026-11-04",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-020",
    "orderNumber": "ORD-017",
    "customerName": "Aravind",
    "amount": 350,
    "date": "2026-11-04",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-021",
    "orderNumber": "ORD-019",
    "customerName": "Tumpa D1703",
    "amount": 300,
    "date": "2026-11-03",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-022",
    "orderNumber": "ORD-019",
    "customerName": "Tumpa D1703",
    "amount": 300,
    "date": "2026-11-03",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-023",
    "orderNumber": "ORD-019",
    "customerName": "Deepti Mehta",
    "amount": 300,
    "date": "2026-11-04",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-024",
    "orderNumber": "ORD-020",
    "customerName": "Sandhya amma frnd",
    "amount": 800,
    "date": "2026-11-05",
    "method": "UPI",
    "status": "Received"
  },
  {
    "id": "pay-sheet-025",
    "orderNumber": "ORD-020",
    "customerName": "Padma Amma friend",
    "amount": 300,
    "date": "2026-11-05",
    "method": "UPI",
    "status": "Received"
  }
];
