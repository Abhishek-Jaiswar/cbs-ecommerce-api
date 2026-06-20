import { prisma } from "../lib/prisma.js";

/**
 * Generates a structured, human-readable SKU code for a product variant.
 * Format: ZV-[CATEGORY]-[STYLE_CODE]-[COLOR]-[SIZE]
 * Example: ZV-RNG-KDN7A4-GLD-07
 */
export async function generateStructuredSku(
  productId: string,
  colorId: string,
  sizeId: string
): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
    },
  });
  if (!product) {
    throw new Error("Product not found");
  }

  const color = await prisma.productColor.findUnique({
    where: { id: colorId },
  });
  if (!color) {
    throw new Error("Product color not found");
  }

  const size = await prisma.productSize.findUnique({
    where: { id: sizeId },
  });
  if (!size) {
    throw new Error("Product size not found");
  }

  // 1. Brand prefix
  const brand = "ZV";

  // 2. Category Abbreviation (3 letters)
  const catName = product.category.name.toUpperCase();
  let catCode = "GEN";
  if (catName.includes("RING")) {
    catCode = "RNG";
  } else if (catName.includes("NECK")) {
    catCode = "NKL";
  } else if (catName.includes("EARR")) {
    catCode = "ERG";
  } else if (catName.includes("BANG")) {
    catCode = "BGL";
  } else if (catName.includes("BRAC")) {
    catCode = "BRC";
  } else if (catName.includes("PEND")) {
    catCode = "PND";
  } else {
    // Fallback: extract uppercase letters or take first 3 chars
    const cleanCat = catName.replace(/[^A-Z]/g, "");
    catCode = cleanCat.slice(0, 3);
    if (catCode.length < 3) {
      catCode = (cleanCat + "GEN").slice(0, 3);
    }
  }

  // 3. Product Style Code (from product name or slug)
  // Use first 3 letters of name + 3 characters from product id to guarantee uniqueness
  const cleanName = product.name.replace(/[^A-Z]/gi, "").toUpperCase();
  const namePart = cleanName.slice(0, 3) || "STYL";
  const idPart = product.id.slice(-3).toUpperCase();
  const styleCode = `${namePart}${idPart}`;

  // 4. Color Abbreviation (3 letters)
  const colorName = color.name.toUpperCase();
  let colorCode = "GEN";
  if (colorName.includes("GOLD")) {
    colorCode = "GLD";
  } else if (colorName.includes("SILV")) {
    colorCode = "SLV";
  } else if (colorName.includes("RUBY")) {
    colorCode = "RBY";
  } else if (colorName.includes("EMER")) {
    colorCode = "EMR";
  } else if (colorName.includes("ROSE")) {
    colorCode = "ROS";
  } else if (colorName.includes("WHIT")) {
    colorCode = "WHT";
  } else if (colorName.includes("BLAC")) {
    colorCode = "BLK";
  } else {
    const cleanColor = colorName.replace(/[^A-Z]/g, "");
    colorCode = cleanColor.slice(0, 3);
    if (colorCode.length < 3) {
      colorCode = (cleanColor + "GEN").slice(0, 3);
    }
  }

  // 5. Size Abbreviation (sanitizing sizes like "ONE SIZE" to "OS")
  const sizeValue = size.value.toUpperCase();
  let sizeCode = sizeValue;
  if (sizeValue.includes("ONE") || sizeValue.includes("FREE") || sizeValue.includes("STANDARD")) {
    sizeCode = "OS";
  } else {
    sizeCode = sizeValue.replace(/[^A-Z0-9]/g, "").slice(0, 3);
    if (!sizeCode) {
      sizeCode = "SZ";
    }
  }

  return `${brand}-${catCode}-${styleCode}-${colorCode}-${sizeCode}`.toUpperCase();
}
