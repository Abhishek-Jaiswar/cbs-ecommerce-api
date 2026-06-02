import { prisma } from "../src/lib/prisma.js";
import argon2 from "argon2";

async function main() {
  console.log("Starting database seeding...");

  // 1. Clean existing data (in correct order of relations)
  console.log("Cleaning old data...");
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productSpecification.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productColor.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.productBrand.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  console.log("Seeding Users...");
  const hashedPassword = await argon2.hash("password123", {
    type: argon2.argon2id,
  });

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@zenvoraa.com",
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: true,
      cart: { create: {} },
      wishlist: { create: {} },
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@zenvoraa.com",
      password: hashedPassword,
      role: "USER",
      emailVerified: true,
      cart: { create: {} },
      wishlist: { create: {} },
    },
  });

  console.log(`Users seeded: Admin (${adminUser.email}), User (${normalUser.email})`);

  // 3. Create Addresses
  console.log("Seeding Addresses...");
  await prisma.address.create({
    data: {
      fullname: "John Doe Home",
      phoneNumber: "+1234567890",
      addressLine1: "123 Main Street",
      addressLine2: "Apt 4B",
      landmark: "Near Central Park",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "USA",
      isDefaultShipping: true,
      isDefaultBilling: true,
      userId: normalUser.id,
    },
  });

  await prisma.address.create({
    data: {
      fullname: "John Doe Office",
      phoneNumber: "+1987654321",
      addressLine1: "456 Corporate Blvd",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "USA",
      isDefaultShipping: false,
      isDefaultBilling: false,
      userId: normalUser.id,
    },
  });

  // 4. Create Brands
  console.log("Seeding Brands...");
  const brandZenVora = await prisma.productBrand.create({
    data: {
      name: "ZenVora",
      image: "https://res.cloudinary.com/demo/image/upload/v12345678/zenvora-logo.png",
      storageKey: "brands/zenvora-logo",
      altText: "ZenVora Brand Logo",
    },
  });

  const brandNike = await prisma.productBrand.create({
    data: {
      name: "Nike",
      image: "https://res.cloudinary.com/demo/image/upload/v12345678/nike-logo.png",
      storageKey: "brands/nike-logo",
      altText: "Nike Brand Logo",
    },
  });

  // 5. Create Categories (with hierarchy)
  console.log("Seeding Categories...");
  const catElectronics = await prisma.category.create({
    data: {
      name: "Electronics",
      slug: "electronics",
      excerpt: "Gadgets and tech hardware",
      image: "https://res.cloudinary.com/demo/image/upload/v12345678/electronics.jpg",
      storageKey: "categories/electronics",
      altText: "Electronics Category",
      isActive: true,
    },
  });

  const catPhones = await prisma.category.create({
    data: {
      name: "Smartphones",
      slug: "smartphones",
      excerpt: "Mobile cell phones and accessories",
      image: "https://res.cloudinary.com/demo/image/upload/v12345678/smartphones.jpg",
      storageKey: "categories/smartphones",
      altText: "Smartphones Subcategory",
      isActive: true,
      parentId: catElectronics.id,
    },
  });

  const catApparel = await prisma.category.create({
    data: {
      name: "Apparel",
      slug: "apparel",
      excerpt: "Clothing and fashion",
      image: "https://res.cloudinary.com/demo/image/upload/v12345678/apparel.jpg",
      storageKey: "categories/apparel",
      altText: "Apparel Category",
      isActive: true,
    },
  });

  // 6. Create Tags
  console.log("Seeding Tags...");
  const tagNew = await prisma.tag.create({
    data: { name: "New", slug: "new" },
  });
  const tagSale = await prisma.tag.create({
    data: { name: "Sale", slug: "sale" },
  });
  const tagTrending = await prisma.tag.create({
    data: { name: "Trending", slug: "trending" },
  });

  // 7. Create Products
  console.log("Seeding Products...");
  const phoneProduct = await prisma.product.create({
    data: {
      name: "ZenVora Phone X",
      slug: "zenvora-phone-x",
      excerpt: "Flagship smartphone with stellar camera.",
      description:
        "Detailed description of ZenVora Phone X with high performance processor and OLED display.",
      price: 999.99,
      originalPrice: 1099.99,
      isFeatured: true,
      isNew: true,
      isSale: false,
      status: "ACTIVE",
      forListing: true,
      brandId: brandZenVora.id,
      categoryId: catPhones.id,
      productTags: {
        create: [{ tagId: tagNew.id }, { tagId: tagTrending.id }],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Nike Sport T-Shirt",
      slug: "nike-sport-t-shirt",
      excerpt: "Comfortable activewear t-shirt.",
      description: "Dri-FIT performance t-shirt optimized for athletic training.",
      price: 29.99,
      originalPrice: 39.99,
      isFeatured: false,
      isNew: false,
      isSale: true,
      status: "ACTIVE",
      forListing: true,
      brandId: brandNike.id,
      categoryId: catApparel.id,
      productTags: {
        create: [{ tagId: tagSale.id }],
      },
    },
  });

  // 8. Create Product Colors, Sizes & Variants
  console.log("Seeding Colors, Sizes, and Variants...");
  const colorSpaceGrey = await prisma.productColor.create({
    data: { name: "Space Grey", hex: "#5A5D64", productId: phoneProduct.id },
  });
  const colorSilver = await prisma.productColor.create({
    data: { name: "Silver", hex: "#C0C0C0", productId: phoneProduct.id },
  });
  const size128GB = await prisma.productSize.create({
    data: { value: "128GB", productId: phoneProduct.id },
  });
  const size256GB = await prisma.productSize.create({
    data: { value: "256GB", productId: phoneProduct.id },
  });

  // Create Phone Variants
  await prisma.productVariant.create({
    data: {
      sku: "ZVP-X-128-GREY",
      price: 999.99,
      stock: 50,
      productId: phoneProduct.id,
      colorId: colorSpaceGrey.id,
      sizeId: size128GB.id,
    },
  });

  await prisma.productVariant.create({
    data: {
      sku: "ZVP-X-256-GREY",
      price: 1099.99,
      stock: 30,
      productId: phoneProduct.id,
      colorId: colorSpaceGrey.id,
      sizeId: size256GB.id,
    },
  });

  await prisma.productVariant.create({
    data: {
      sku: "ZVP-X-128-SILV",
      price: 999.99,
      stock: 45,
      productId: phoneProduct.id,
      colorId: colorSilver.id,
      sizeId: size128GB.id,
    },
  });

  // 9. Create Product Specifications
  console.log("Seeding Specifications...");
  await prisma.productSpecification.createMany({
    data: [
      { productId: phoneProduct.id, key: "Screen Size", value: "6.7 inches" },
      { productId: phoneProduct.id, key: "Processor", value: "A15 Bionic" },
      { productId: phoneProduct.id, key: "RAM", value: "8 GB" },
    ],
  });

  // 10. Create Product Reviews
  console.log("Seeding Reviews...");
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Absolutely amazing phone! Best purchase of the year.",
      userId: normalUser.id,
      productId: phoneProduct.id,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding database: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
