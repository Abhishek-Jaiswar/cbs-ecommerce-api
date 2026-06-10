import { productCache } from "../src/modules/products/products.cache.js";

async function main() {
  try {
    console.log("Invalidating product lists cache...");
    await productCache.invalidateProductLists();
    console.log("Product lists cache invalidated successfully!");
  } catch (error) {
    console.error("Failed to invalidate cache:", error);
  } finally {
    process.exit(0);
  }
}

main();
