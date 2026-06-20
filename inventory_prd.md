# Product Requirement Document (PRD): Zenvora Advanced Inventory Management System

---

## 1. Document Control
* **Author**: Antigravity (AI Coding Assistant) & E-Commerce Platform Lead
* **Status**: Draft (Awaiting Approval)
* **Version**: 1.0.0
* **Date**: June 19, 2026

---

## 2. Executive Summary & Goals

### 2.1 Problem Statement
The current Zenvora system manages inventory using a single, static `stock` number on the `ProductVariant` table. This approach has critical business limitations:
1. **Overselling risk**: Stock is decremented only at payment/confirmation, creating a gap where multiple users can add the last item to their cart.
2. **No Audit Trail**: Stock adjustments are made directly without logs, making it impossible to audit losses, shrinkage, or manual staff errors.
3. **No Replenishment System**: Admins have no systemic way of tracking vendors, creating Purchase Orders, or setting automated reorder thresholds.

### 2.2 Product Goals
Transform Zenvora's stock tracking into a fully automated, scalable supply-chain system that supports multiple warehouses, prevents checkout stock issues, records a tamper-proof audit trail, and simplifies vendor replenishment.

---

## 3. Core Features & Requirements

### 3.1 Advanced Stock Allocation
Instead of tracking a single `stock` integer, inventory will follow a state-based pipeline:
* **Physical Stock (`physicalQty`)**: The total count physically residing in the warehouse location.
* **Committed Stock (`committedQty`)**: Stock reserved for orders that are placed but not yet packed/shipped.
* **Available Stock (`availableQty`)**: The public stock for sale. Calculated dynamically:
  $$\text{Available Stock} = \text{Physical Stock} - \text{Committed Stock}$$
* **On Order (`onOrderQty`)**: Stock ordered from suppliers but not yet received.

> [!IMPORTANT]
> The storefront catalog and cart validation must exclusively query and check against `Available Stock`.

---

### 3.2 Inventory Transaction Ledger (Audit Trail)
Every single change in stock must create a read-only record in the database.
* **Transaction Types**:
  * `ORDER_RESERVED`: Customer checked out, stock is committed.
  * `ORDER_SHIPPED`: Order leaves warehouse, physical stock decreases, committed stock decreases.
  * `ORDER_CANCELLED`: Unshipped order cancelled, committed stock decreases, available stock goes back up.
  * `REPLENISHMENT`: Goods received from a supplier (increases physical stock).
  * `MANUAL_ADJUSTMENT`: Admin manually corrects stock (due to count discrepancies).
  * `SHRINKAGE`: Stock discarded (theft, damage, expiration).
  * `CUSTOMER_RETURN`: Shipped item returned and restocked.

---

### 3.3 Supplier & Purchase Order (PO) Management
* **Supplier Profiles**: Admin can create and manage supplier contact info, lead times, and default cost pricing.
* **Purchase Order (PO) Workflow**:
  ```mermaid
  stateDiagram-v2
      [*] --> Draft : Create PO
      Draft --> Sent : Approve & Email Vendor
      Sent --> PartiallyReceived : Partial Delivery
      Sent --> Received : Full Delivery
      PartiallyReceived --> Received : Remaining Items Received
      Received --> [*] : Stock Auto-Updated
  ```
* **Receiving Goods**: When a PO status changes to `Received`, the system automatically increments the target variant's `physicalQty`.

---

### 3.4 Low-Stock Alerts & Auto-Reordering
* **Reorder Levels**: Each variant can define a unique `reorderPoint` (e.g. notify when stock drops below 15) and a `preferredReorderQty`.
* **Automated Alerts**: A daily cron job checks for variants where $\text{Available Stock} \le \text{reorderPoint}$ and alerts admins via the dashboard and email notifications.

---

### 3.5 Multi-Warehouse Support
* **Warehouses**: Manage multiple inventory locations (e.g., "Main Delhi Warehouse", "Mumbai Fulfillment Center").
* **Stock Levels**: Variant quantities are mapped per-location.
* **Order Routing**: Fulfill orders from the closest warehouse with available stock.

---

## 4. Proposed Database Schema Design (Prisma)

To support these features, the database schema will be updated:

```prisma
model ProductVariant {
  id        String   @id @default(cuid())
  sku       String?  @unique
  price     Decimal? @db.Decimal(10, 2)
  
  // Advanced Stock Levels
  physicalQty   Int @default(0)
  committedQty  Int @default(0)
  onOrderQty    Int @default(0)
  
  // Reorder thresholds
  reorderPoint  Int @default(5)
  preferredReorderQty Int @default(20)

  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  // Relationships
  warehouseStocks WarehouseStock[]
  transactions    InventoryTransaction[]
  poItems         PurchaseOrderItem[]

  // Other existing fields...
  colorId   String
  sizeId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Warehouse {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique // e.g. WH-DELHI
  addressLine String
  city        String
  state       String
  postalCode  String
  country     String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  stocks WarehouseStock[]
  transactions InventoryTransaction[]
}

model WarehouseStock {
  id          String   @id @default(cuid())
  warehouseId String
  variantId   String
  physicalQty Int      @default(0)
  committedQty Int     @default(0)

  warehouse   Warehouse      @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  variant     ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)

  @@unique([warehouseId, variantId])
}

model InventoryTransaction {
  id             String          @id @default(cuid())
  variantId      String
  warehouseId    String?
  type           TransactionType
  qtyChange      Int             // e.g. -5, +20
  previousQty    Int             // State of availableQty before transaction
  newQty         Int             // State of availableQty after transaction
  reason         String?
  userId         String?         // Admin user who performed adjustment
  orderId        String?         // Connected customer order
  poId           String?         // Connected purchase order
  createdAt      DateTime        @default(now())

  variant        ProductVariant  @relation(fields: [variantId], references: [id], onDelete: Cascade)
  warehouse      Warehouse?      @relation(fields: [warehouseId], references: [id], onDelete: SetNull)
  user           User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
}

enum TransactionType {
  ORDER_RESERVED
  ORDER_SHIPPED
  ORDER_CANCELLED
  REPLENISHMENT
  MANUAL_ADJUSTMENT
  SHRINKAGE
  CUSTOMER_RETURN
}

model Supplier {
  id           String   @id @default(cuid())
  name         String
  contactName  String?
  email        String   @unique
  phone        String?
  address      String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  purchaseOrders PurchaseOrder[]
}

model PurchaseOrder {
  id           String         @id @default(cuid())
  poNumber     String         @unique // e.g. PO-2026-0001
  supplierId   String
  status       POStatus       @default(DRAFT)
  totalAmount  Decimal        @db.Decimal(10, 2)
  notes        String?
  orderedAt    DateTime?
  expectedAt   DateTime?
  receivedAt   DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  supplier     Supplier       @relation(fields: [supplierId], references: [id], onDelete: Restrict)
  items        PurchaseOrderItem[]
}

model PurchaseOrderItem {
  id              String        @id @default(cuid())
  poId            String
  variantId       String
  quantityOrdered Int
  quantityReceived Int          @default(0)
  unitCost        Decimal       @db.Decimal(10, 2)

  purchaseOrder   PurchaseOrder  @relation(fields: [poId], references: [id], onDelete: Cascade)
  variant         ProductVariant @relation(fields: [variantId], references: [id], onDelete: Restrict)

  @@unique([poId, variantId])
}

enum POStatus {
  DRAFT
  SENT
  PARTIALLY_RECEIVED
  RECEIVED
  CANCELLED
}
```

---

## 5. API Endpoints & Contracts

### 5.1 Inventory Queries
* **`GET /api/v1/inventory`** (Admin)
  * Returns list of variants, physicalQty, committedQty, availableQty, reorderPoints.
* **`GET /api/v1/inventory/transactions`** (Admin)
  * Returns list of recent transactions for auditing. Filterable by type, variant, or date range.

### 5.2 Stock Operations
* **`POST /api/v1/inventory/adjust`** (Admin)
  * Body: `{ variantId: string, warehouseId: string, qtyChange: number, type: 'MANUAL_ADJUSTMENT' | 'SHRINKAGE', reason: string }`
  * Action: Updates stock levels and writes an `InventoryTransaction`.
* **`POST /api/v1/inventory/purchase-orders`** (Admin)
  * Body: `{ supplierId: string, items: [{ variantId: string, quantityOrdered: number, unitCost: number }] }`
  * Action: Creates a new PO.
* **`POST /api/v1/inventory/purchase-orders/:id/receive`** (Admin)
  * Body: `{ items: [{ variantId: string, quantityReceived: number }] }`
  * Action: Records incoming quantities, updates variant `onOrderQty`, increments `physicalQty`, and creates `REPLENISHMENT` transactions.

---

## 6. Detailed Flow Stories

### 6.1 Flow Story 1: Customer Order Lifecycle (Sale & Fulfillment)
This scenario demonstrates how Zenvora ensures stock consistency during checkout and packing.

1. **Storefront Status**:
   - Product: "Ruby Kundan Ring" has **Physical Stock = 10**, **Committed Stock = 0**, **Available Stock = 10**.
2. **Customer Places Order**:
   - Customer `Priya` buys `2` rings.
   - Inside the database transaction, the system checks `Available Stock (10) >= 2`.
   - The transaction succeeds:
     * **Committed Stock** increases to `2`.
     * **Available Stock** decreases to `8`.
     * Storefront now displays `8` available for other shoppers.
     * An `InventoryTransaction` is recorded: `ORDER_RESERVED` (`qtyChange: -2`, `previousQty: 10`, `newQty: 8`).
3. **Warehouse Fulfillment**:
   - Warehouse worker picks the `2` rings and packages them.
   - Worker clicks "Ship Order" in the admin dashboard.
   - The database updates:
     * **Physical Stock** drops from `10` to `8`.
     * **Committed Stock** drops from `2` to `0`.
     * **Available Stock** remains stable at `8`.
     * An `InventoryTransaction` is recorded: `ORDER_SHIPPED`.

---

### 6.2 Flow Story 2: Order Cancellation & Restocking
This scenario demonstrates what happens when an unpaid order is cancelled.

1. **State After Reservation**:
   - **Physical Stock = 10**, **Committed Stock = 2**, **Available Stock = 8**.
2. **Cancellation Trigger**:
   - Priya cancels the order before shipment.
   - The database updates:
     * **Committed Stock** drops from `2` to `0`.
     * **Available Stock** increases from `8` to `10`.
     * **Physical Stock** stays at `10` (since it never left the shelf).
     * An `InventoryTransaction` is recorded: `ORDER_CANCELLED` (`qtyChange: +2`, `previousQty: 8`, `newQty: 10`).

---

### 6.3 Flow Story 3: Vendor Replenishment (Supplier Reordering)
This scenario tracks how low stock triggers restock workflows.

1. **Stock Drops**:
   - Due to sales, the "Emerald Pearl Choker" stock drops to **Available Stock = 4**.
   - Since the choker has a `reorderPoint = 5`, the system alerts the admin.
2. **Admin Generates Purchase Order**:
   - Admin creates a PO for `50` units of choker at a cost of `$30/unit` from Supplier "Shine Jewelry Delhi".
   - PO is set to `SENT`.
   - The variant's **On Order Stock (`onOrderQty`)** is set to `50`.
3. **Goods Received**:
   - A shipping container arrives at the warehouse. The staff counts the delivery: full `50` units received.
   - Admin marks the PO status as `RECEIVED`.
   - The database updates:
     * **On Order Stock** drops by `50` (returns to `0`).
     * **Physical Stock** increases by `50`.
     * **Available Stock** increases by `50` (allowing customers to buy again).
     * An `InventoryTransaction` is recorded: `REPLENISHMENT` (`qtyChange: +50`, linked to `poId`).
