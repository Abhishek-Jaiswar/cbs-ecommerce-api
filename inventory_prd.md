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

---

## 7. Product Lifecycle & Inventory Initialization Flow

This section details how a jewelry product moves from creation to becoming a sellable inventory item within the Zenvora platform, compared and aligned with the current system implementation.

---

### Step 1: Create the Core Product
The administrator begins by creating the basic product information.
* **Admin Action**: Creates a new product entering Product Name, Description, Base Price, Category, Brand, and Product Specifications (e.g. *Royal Kundan Necklace Set*, Category: *Necklaces*).
* **System Action**: Creates a new `Product` database record.
  * Default Values: `status = DRAFT`, `forListing = false`.
* **Inventory Status**: No inventory exists yet. No SKU is generated, and no stock is registered. The product acts purely as a container for future variants.

---

### Step 2: Configure Product Options
The administrator defines the available attributes that will be used to create sellable variants.
* **Admin Action**: Creates options such as Colors (*Gold Plated*, *Silver Plated*) and Sizes (*One Size*).
* **System Action**: Creates `ProductColor` and `ProductSize` records linked to the parent `Product`.
* **Inventory Status**: Still no inventory exists. No stock can be sold until variants are generated.

---

### Step 3: Generate Product Variants (Inventory Initialization)
This is the stage where inventory management officially begins.
* **Admin Action**: Generates variants for the product (e.g., *Gold Plated / One Size*, *Silver Plated / One Size*).
* **System Action**: Creates `ProductVariant` records.
  * **SKU Generation**: The system automatically generates a unique SKU using the format defined in [sku-helper.ts](file:///c:/Users/abhis/Desktop/cbs-ecommerce/server/src/helpers/sku-helper.ts): `ZV-[CATEGORY]-[STYLE_CODE]-[COLOR]-[SIZE]`.
    * *Example Gold*: `ZV-NKL-ROY9A4-GLD-OS`
    * *Example Silver*: `ZV-NKL-ROY9A4-SLV-OS`
  * **Initial Stock Levels**: Variant records are initialized with:
    * `physicalQty = 0`
    * `committedQty = 0`
    * `onOrderQty = 0`
    * Dynamic Available Stock (`physicalQty - committedQty`) = `0`
* **Warehouse Mappings**: The database schema maps inventory per location via the `WarehouseStock` model. When variants are generated, `WarehouseStock` records are initialized for each warehouse with `physicalQty = 0` and `committedQty = 0`, ensuring inventory tracking is enabled per location from day one.
* **Storefront Status**: The storefront displays the variant as **Out of Stock** because Available Stock is `0`.

---

### Step 4: Add Initial Inventory (Manual Adjustment)
Once physical inventory arrives, the administrator records the opening stock quantities.
* **Admin Action**: Records the count (e.g., *Gold Plated / One Size = 20 Units*, *Silver Plated / One Size = 10 Units*).
* **API Action**: Sends an adjustment request to `POST /api/v1/inventory/adjust` with type `MANUAL_ADJUSTMENT`, specifying the variant and quantity change (+20).
* **System Action**: Updates the target variant's `physicalQty` in the database.
* **Audit Trail**: Writes an `InventoryTransaction` record:
  * `type = MANUAL_ADJUSTMENT`
  * `qtyChange = +20`
  * `previousQty = 0`
  * `newQty = 20`
  * `reason = "Initial Stock Intake"`

---

### Step 5: Publish Product
After inventory is available, the administrator activates the product.
* **Admin Action**: Sets `status = ACTIVE` and `forListing = true`.
* **System Action**: The storefront begins displaying inventory using Available Stock (`physicalQty - committedQty`).
  * *Gold Plated Variant*: 20 Units Available
  * *Silver Plated Variant*: 10 Units Available
* **Business Result**: Customers can now view the product, add variants to their cart, and place orders.

---

### Step 6: Stock Depletion & Low-Stock Monitoring
As customers purchase variants, inventory levels decrease.
* **Scenario**: Customers purchase 6 units of *Silver Plated / One Size* (`ZV-NKL-ROY9A4-SLV-OS`).
* **Fulfillment Pipeline**:
  * On order placement: `committedQty` increases by `6`, available stock drops to `4`.
  * On order shipment: `physicalQty` drops to `4`, `committedQty` decreases back to `0`, available stock remains `4`.
  * An `InventoryTransaction` with type `ORDER_SHIPPED` is recorded.
* **Reorder Threshold Check**: Since the variant's Available Stock (`4`) is less than or equal to its `reorderPoint` (`5`), it is flagged as **Low Stock**.
* **Automated Action**: Low stock items are highlighted in the Restock Dashboard to trigger replenishment alerts.

---

### Step 7: Purchase Order (PO) Creation
The Store Manager initiates a replenishment request.
* **Admin Action**: Navigates to Inventory → Purchase Orders → Create PO, choosing the supplier, variants, quantity (*50 Units*), and cost (*₹2,500/unit*).
* **System Action**: Creates a `PurchaseOrder` in `DRAFT` status.
* **Approval Workflow**: When the manager clicks **Approve & Send**:
  1. PO status changes to `SENT`.
  2. The system triggers an automated email with the PO PDF attached to the supplier.
  3. Increments the target variant's `onOrderQty` by `50` in the database.
* **Inventory Status**: `Incoming Stock (On Order) = 50`. The stock is not yet available for sale, but is tracked as expected delivery.

---

### Step 8: Goods Receipt & Delivery Check-In
When the delivery arrives from the supplier, warehouse staff verify the shipment.
* **Warehouse Action**: Counts received units, checks for defects, and confirms matching quantities.
* **Admin Action**: Navigates to the PO in the dashboard and clicks **Receive Delivery / Receive Items** specifying the received quantities (e.g. *50 Units*).

---

### Step 9: Automatic Inventory Update
* **API Action**: Calls `POST /api/v1/inventory/purchase-orders/:id/receive`.
* **System Action**: The inventory service updates database values:
  * Variant `physicalQty` increases by `50` (e.g., from `4` to `54`).
  * Variant `onOrderQty` decreases by `50` (returning to `0`).
  * Dynamic available stock recalculates immediately: `54 - 0 = 54`.
* **Storefront Status**: Customers can immediately purchase the restocked item.

---

### Step 10: Purchase Order Completion
* **System Action**: The PO status updates from `SENT` to `RECEIVED` (or `PARTIALLY_RECEIVED` if only a portion of the ordered quantity was check-in).

---

### Step 11: Inventory Ledger Recording
Every replenishment creates a permanent audit record.
* **System Action**: Logs an `InventoryTransaction` record:
  * `type = REPLENISHMENT`
  * `qtyChange = +50`
  * `previousQty = 4`
  * `newQty = 54`
  * `reason = "Replenishment from Purchase Order [PO Number]"`
  * `poId = [PO ID]`
  * `userId = [Staff User ID]`
