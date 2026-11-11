import {
  InventoryItem,
  Order,
  Payment,
  Product,
  RecipeIngredient,
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

export const initialSheetInventory: InventoryItem[] = [
  {
    "id": "inv-mat-01",
    "name": "Metal tealight holder (gold)",
    "type": "Raw Material",
    "category": "Diyas",
    "stock": 204,
    "unit": "pcs",
    "reorderLevel": 40,
    "avgUnitCost": 10.32,
    "purchaseSource": "Amazon (GADINFASHION 72, indianhandicrafts 24) + NandiArts (108); +60 Shipped Meesho",
    "status": "Healthy",
    "supplier": "NandiArts / Amazon"
  },
  {
    "id": "inv-mat-02",
    "name": "MDF round board 4in",
    "type": "Raw Material",
    "category": "Diyas",
    "stock": 450,
    "unit": "pcs",
    "reorderLevel": 50,
    "avgUnitCost": 1.5,
    "purchaseSource": "Meesho (100 pcs @ ₹3.26) + NandiArts (350 pcs @ ₹1.00); +150 Shipped Meesho",
    "status": "Healthy",
    "supplier": "NandiArts Stationery BegumBazaar"
  },
  {
    "id": "inv-mat-03",
    "name": "Candle wick (3 inch)",
    "type": "Raw Material",
    "category": "Candles",
    "stock": 140,
    "unit": "pcs",
    "reorderLevel": 30,
    "avgUnitCost": 1.74,
    "purchaseSource": "Amazon Low Smoke Wicks (100 @ ₹198) + Just Kraft Pre-Waxed (40 @ ₹45)",
    "status": "Healthy",
    "supplier": "Amazon / Just Kraft"
  },
  {
    "id": "inv-mat-04",
    "name": "Plastic tealight cup (acrylic)",
    "type": "Raw Material",
    "category": "Candles",
    "stock": 171,
    "unit": "pcs",
    "reorderLevel": 30,
    "avgUnitCost": 9.7,
    "purchaseSource": "Amazon (50 @ ₹380) + Just Kraft Acrylic Cups (121 @ ₹1,278.51)",
    "status": "Healthy",
    "supplier": "Just Kraft / Amazon"
  },
  {
    "id": "inv-mat-05",
    "name": "stickers",
    "type": "Raw Material",
    "category": "Candles",
    "stock": 200,
    "unit": "pcs",
    "reorderLevel": 40,
    "avgUnitCost": 0.9,
    "purchaseSource": "Just Kraft Candle Wick Stickers 12mm (200 pcs @ ₹180)",
    "status": "Healthy",
    "supplier": "Just Kraft"
  },
  {
    "id": "inv-mat-06",
    "name": "Pearls 8mm",
    "type": "Raw Material",
    "category": "Diyas",
    "stock": 1500,
    "unit": "pcs",
    "reorderLevel": 200,
    "avgUnitCost": 0.13,
    "purchaseSource": "Amazon White Pearl Beads 8mm (1,500 pcs @ ₹189)",
    "status": "Healthy",
    "supplier": "Amazon"
  },
  {
    "id": "inv-mat-07",
    "name": "Glue Sticks",
    "type": "Raw Material",
    "category": "Packaging",
    "stock": 30,
    "unit": "pcs",
    "reorderLevel": 8,
    "avgUnitCost": 9.53,
    "purchaseSource": "Amazon Themisto 11mm Hot Melt Glue Sticks (30 pcs @ ₹286)",
    "status": "Healthy",
    "supplier": "Amazon"
  },
  {
    "id": "inv-mat-08",
    "name": "Gold gift box 12cm",
    "type": "Packaging",
    "category": "Packaging",
    "stock": 108,
    "unit": "pcs",
    "reorderLevel": 20,
    "avgUnitCost": 23.4,
    "purchaseSource": "Amazon Divyakosh 12cm Gold Gift Boxes (48 + 36 + 24 = 108 pcs @ ₹2,527)",
    "status": "Healthy",
    "supplier": "Amazon"
  },
  {
    "id": "inv-mat-09",
    "name": "Packing grass",
    "type": "Packaging",
    "category": "Packaging",
    "stock": 900,
    "unit": "g",
    "reorderLevel": 150,
    "avgUnitCost": 0.3,
    "purchaseSource": "Runicha Stationers (400g @ ₹120) + Bhagwanlal & Co (500g @ ₹150)",
    "status": "Healthy",
    "supplier": "Runicha Stationers, Osmanganj"
  },
  {
    "id": "inv-mat-10",
    "name": "Lotus Petals PINK Transparent",
    "type": "Raw Material",
    "category": "Diyas",
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 100,
    "purchaseSource": "Recipe material — update stock count & ₹/petal in Inventory or Recipe",
    "status": "Critical"
  },
  {
    "id": "inv-mat-11",
    "name": "Lotus Petals GOLD",
    "type": "Raw Material",
    "category": "Diyas",
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 100,
    "purchaseSource": "Recipe material — update stock count & ₹/petal in Inventory or Recipe",
    "status": "Critical"
  },
  {
    "id": "inv-mat-12",
    "name": "Green flower candle",
    "type": "Raw Material",
    "category": "Candles",
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 20,
    "purchaseSource": "Recipe sub-component — update stock & ₹/pc cost",
    "status": "Critical"
  },
  {
    "id": "inv-mat-13",
    "name": "Pink Colour Flower Candle",
    "type": "Raw Material",
    "category": "Candles",
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 20,
    "purchaseSource": "Recipe sub-component — update stock & ₹/pc cost",
    "status": "Critical"
  },
  {
    "id": "inv-mat-14",
    "name": "Golden Paint",
    "type": "Raw Material",
    "category": "Diyas",
    "stock": 100,
    "unit": "ml",
    "reorderLevel": 20,
    "purchaseSource": "Runicha Stationers High Coverage Gold Paint (₹200) — enter ₹/ml once bottle ml confirmed",
    "status": "Healthy",
    "supplier": "Runicha Stationers, Osmanganj"
  },
  {
    "id": "inv-mat-15",
    "name": "Zari doori GOLD",
    "type": "Raw Material",
    "category": "Diyas",
    "stock": 150,
    "unit": "m",
    "reorderLevel": 20,
    "purchaseSource": "Local market Zari Doori (3 × 50 = 150 @ ₹150) — confirm ₹/unit per recipe length",
    "status": "Healthy",
    "supplier": "Local market"
  },
  {
    "id": "inv-mat-16",
    "name": "Soy wax",
    "type": "Raw Material",
    "category": "Candles",
    "stock": 0,
    "unit": "g",
    "reorderLevel": 500,
    "purchaseSource": "Enter stock (g) & landed ₹/g to cost candle weight in Recipes",
    "status": "Critical"
  },
  {
    "id": "inv-mat-17",
    "name": "Businesss Card",
    "type": "Packaging",
    "category": "Packaging",
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 50,
    "purchaseSource": "Enter stock & print ₹/card",
    "status": "Critical"
  },
  {
    "id": "inv-mat-18",
    "name": "Thankyou Sticker",
    "type": "Packaging",
    "category": "Packaging",
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 50,
    "purchaseSource": "Enter stock & print ₹/sticker",
    "status": "Critical"
  },
  {
    "id": "inv-mat-19",
    "name": "Lace Gold Semi-Circle Chip",
    "type": "Raw Material",
    "category": "Glassware",
    "stock": 0,
    "unit": "pcs",
    "reorderLevel": 50,
    "purchaseSource": "Enter stock & ₹/unit for Carmine Candle glass trim",
    "status": "Critical"
  },
  {
    "id": "inv-mat-20",
    "name": "Pearls 6mm",
    "type": "Raw Material",
    "category": "Diyas",
    "stock": 2000,
    "unit": "pcs",
    "reorderLevel": 250,
    "avgUnitCost": 0.1,
    "purchaseSource": "Meesho White Pearl Beads 6mm (2,000 pcs @ ₹194.60)",
    "status": "Healthy",
    "supplier": "Meesho"
  },
  {
    "id": "inv-mat-21",
    "name": "Gold Lotus Urli Holder (4in)",
    "type": "Raw Material",
    "category": "Home Decor",
    "stock": 6,
    "unit": "pcs",
    "reorderLevel": 2,
    "avgUnitCost": 53.1,
    "purchaseSource": "Just Kraft Gold Lotus Urli Tealight Holder 4in (6 pcs @ ₹318.60)",
    "status": "Healthy",
    "supplier": "Just Kraft"
  }
];

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
    "materialName": "stickers",
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
    "unit": "m"
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
    "materialName": "Businesss Card",
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
    "unit": "pcs"
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
