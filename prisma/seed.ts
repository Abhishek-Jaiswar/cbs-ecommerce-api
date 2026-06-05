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
  await prisma.offerProduct.deleteMany();
  await prisma.offerCategory.deleteMany();
  await prisma.offer.deleteMany();
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

  const catJewelry = await prisma.category.create({
    data: {
      name: "Jewelry",
      slug: "jewelry",
      excerpt: "Premium crafted jewelry collections",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800",
      storageKey: "categories/jewelry",
      altText: "Premium Jewelry",
      isActive: true,
    },
  });

  const catRings = await prisma.category.create({
    data: {
      name: "Rings",
      slug: "rings",
      excerpt: "Elegantly designed rings for every occasion",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500",
      storageKey: "categories/rings",
      altText: "Elegantly Designed Rings",
      isActive: true,
      parentId: catJewelry.id,
    },
  });

  const catNecklaces = await prisma.category.create({
    data: {
      name: "Necklaces",
      slug: "necklaces",
      excerpt: "Lustrous necklaces and pendants",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500",
      storageKey: "categories/necklaces",
      altText: "Lustrous Necklaces",
      isActive: true,
      parentId: catJewelry.id,
    },
  });

  const catEarrings = await prisma.category.create({
    data: {
      name: "Earrings",
      slug: "earrings",
      excerpt: "Sparkling stud, hoop, and drop earrings",
      image: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=500",
      storageKey: "categories/earrings",
      altText: "Sparkling Earrings",
      isActive: true,
      parentId: catJewelry.id,
    },
  });

  const catBracelets = await prisma.category.create({
    data: {
      name: "Bracelets",
      slug: "bracelets",
      excerpt: "Premium tennis, bangle, and chain bracelets",
      image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500",
      storageKey: "categories/bracelets",
      altText: "Premium Bracelets",
      isActive: true,
      parentId: catJewelry.id,
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
  const tagGold = await prisma.tag.create({
    data: { name: "Gold", slug: "gold" },
  });
  const tagDiamond = await prisma.tag.create({
    data: { name: "Diamond", slug: "diamond" },
  });
  const tagSilver = await prisma.tag.create({
    data: { name: "Silver", slug: "silver" },
  });
  const tagLuxury = await prisma.tag.create({
    data: { name: "Luxury", slug: "luxury" },
  });
  const tagGift = await prisma.tag.create({
    data: { name: "Gift", slug: "gift" },
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

  // 8. Create Product Colors, Sizes & Variants for Original Products
  console.log("Seeding Colors, Sizes, and Variants for original products...");
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

  // 9. Create Product Specifications for Original Products
  console.log("Seeding Specifications for original products...");
  await prisma.productSpecification.createMany({
    data: [
      { productId: phoneProduct.id, key: "Screen Size", value: "6.7 inches" },
      { productId: phoneProduct.id, key: "Processor", value: "A15 Bionic" },
      { productId: phoneProduct.id, key: "RAM", value: "8 GB" },
    ],
  });

  // 10. Create Product Reviews for Original Products
  console.log("Seeding Reviews for original products...");
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Absolutely amazing phone! Best purchase of the year.",
      userId: normalUser.id,
      productId: phoneProduct.id,
    },
  });

  // 11. Create Jewelry Products
  console.log("Seeding Jewelry Products...");
  const jewelryProductsData = [
    {
      name: "Diamond Solitaire Engagement Ring",
      slug: "diamond-solitaire-engagement-ring",
      excerpt: "A stunning classic 1-carat round diamond solitaire ring.",
      description: "Crafted in 14K gold or platinum, this timeless engagement ring features a brilliant 1-carat round solitaire diamond in a secure 4-prong setting. The perfect symbol of eternal love.",
      price: 1499.99,
      originalPrice: 1799.99,
      isFeatured: true,
      isNew: true,
      isSale: false,
      categoryId: catRings.id,
      tags: [tagNew.id, tagTrending.id, tagLuxury.id, tagDiamond.id],
      colors: [
        { name: "White Gold", hex: "#F3ECE0" },
        { name: "Yellow Gold", hex: "#E5C453" },
        { name: "Platinum", hex: "#E5E5E5" }
      ],
      sizes: ["5", "6", "7", "8"],
      specifications: [
        { key: "Metal", value: "14K Gold / Platinum" },
        { key: "Gemstone", value: "Natural Diamond" },
        { key: "Carat Weight", value: "1.0 ct" },
        { key: "Diamond Clarity", value: "VS2" }
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800", alt: "Solitaire Diamond Ring Front View" },
        { url: "https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800", alt: "Solitaire Diamond Ring on Box" }
      ],
      reviews: [
        { rating: 5, comment: "She said yes! The ring is absolutely gorgeous and sparkles brilliantly.", userEmail: "john@zenvoraa.com" }
      ]
    },
    {
      name: "Eternal Gold Wedding Band",
      slug: "eternal-gold-wedding-band",
      excerpt: "A timeless, high-polish 18K yellow gold band.",
      description: "Simple, elegant, and classic. This 4mm wedding band is crafted in solid 18K yellow or rose gold with a comfort-fit design for comfortable daily wear.",
      price: 499.99,
      originalPrice: 599.99,
      isFeatured: false,
      isNew: false,
      isSale: true,
      categoryId: catRings.id,
      tags: [tagSale.id, tagTrending.id, tagGold.id],
      colors: [
        { name: "Yellow Gold", hex: "#E5C453" },
        { name: "Rose Gold", hex: "#B76E79" }
      ],
      sizes: ["6", "7", "8", "9"],
      specifications: [
        { key: "Metal", value: "18K Gold" },
        { key: "Band Width", value: "4mm" },
        { key: "Style", value: "Comfort Fit Classic Band" }
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800", alt: "Gold Wedding Band" }
      ],
      reviews: []
    },
    {
      name: "Sapphire & Diamond Halo Ring",
      slug: "sapphire-diamond-halo-ring",
      excerpt: "Royal blue oval sapphire surrounded by a halo of brilliant diamonds.",
      description: "Make a statement with this vintage-inspired ring featuring a 1.5-carat oval blue sapphire surrounded by a glittering halo of round diamonds, set in 14K white gold.",
      price: 1249.99,
      originalPrice: 1399.99,
      isFeatured: true,
      isNew: false,
      isSale: false,
      categoryId: catRings.id,
      tags: [tagLuxury.id, tagDiamond.id],
      colors: [
        { name: "White Gold", hex: "#F3ECE0" }
      ],
      sizes: ["6", "7", "8"],
      specifications: [
        { key: "Metal", value: "14K White Gold" },
        { key: "Gemstone", value: "Blue Sapphire (Oval)" },
        { key: "Accent Stone", value: "Natural Diamonds" },
        { key: "Sapphire Weight", value: "1.5 ct" }
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800", alt: "Sapphire Halo Ring" }
      ],
      reviews: []
    },
    {
      name: "Classic Cultured Pearl Necklace",
      slug: "classic-cultured-pearl-necklace",
      excerpt: "A strand of lustrous freshwater cultured pearls.",
      description: "A jewelry collection essential. This 18-inch necklace features uniform 7.5mm freshwater cultured pearls with high luster, finished with a solid 14K yellow gold filigree clasp.",
      price: 299.99,
      originalPrice: 349.99,
      isFeatured: false,
      isNew: false,
      isSale: false,
      categoryId: catNecklaces.id,
      tags: [tagTrending.id, tagGift.id],
      colors: [
        { name: "White Pearl", hex: "#F8F6F0" }
      ],
      sizes: ["16 inch", "18 inch"],
      specifications: [
        { key: "Pearl Type", value: "Freshwater Cultured" },
        { key: "Pearl Size", value: "7.0 - 7.5mm" },
        { key: "Clasp", value: "14K Yellow Gold Filigree" },
        { key: "Length", value: "16 or 18 Inches" }
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800", alt: "Pearl Necklace" }
      ],
      reviews: []
    },
    {
      name: "Sparkling Diamond Tennis Necklace",
      slug: "sparkling-diamond-tennis-necklace",
      excerpt: "Stunning round brilliant diamonds set in a continuous stream of light.",
      description: "Ultimate luxury. Over 100 hand-selected round brilliant diamonds set in a 17-inch continuous line in solid 14K white or yellow gold.",
      price: 2499.99,
      originalPrice: 2999.99,
      isFeatured: true,
      isNew: true,
      isSale: false,
      categoryId: catNecklaces.id,
      tags: [tagNew.id, tagLuxury.id, tagDiamond.id],
      colors: [
        { name: "White Gold", hex: "#F3ECE0" },
        { name: "Yellow Gold", hex: "#E5C453" }
      ],
      sizes: ["17 inch"],
      specifications: [
        { key: "Metal", value: "14K Gold" },
        { key: "Total Diamond Weight", value: "5.0 tcw" },
        { key: "Diamond Cut", value: "Round Brilliant" },
        { key: "Length", value: "17 Inches" }
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800", alt: "Diamond Tennis Necklace" }
      ],
      reviews: []
    },
    {
      name: "Elegance Gold Herringbone Chain",
      slug: "elegance-gold-herringbone-chain",
      excerpt: "Sleek and flat herringbone pattern chain in 14K gold.",
      description: "Add a touch of modern minimalism to your look with this flat-lay herringbone chain. Sleek and polished, this chain catch the light beautifully.",
      price: 399.99,
      originalPrice: 449.99,
      isFeatured: false,
      isNew: false,
      isSale: true,
      categoryId: catNecklaces.id,
      tags: [tagSale.id, tagGold.id, tagTrending.id],
      colors: [
        { name: "Yellow Gold", hex: "#E5C453" }
      ],
      sizes: ["18 inch", "20 inch"],
      specifications: [
        { key: "Metal", value: "14K Yellow Gold" },
        { key: "Chain Width", value: "3.5mm" },
        { key: "Clasp Type", value: "Lobster Claw" }
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1611085583191-a3b1a30a8a3a?w=800", alt: "Gold Herringbone Chain" }
      ],
      reviews: []
    },
    {
      name: "Classic Diamond Stud Earrings",
      slug: "classic-diamond-stud-earrings",
      excerpt: "Brilliant round-cut diamond studs in a secure four-prong setting.",
      description: "An elegant pair of diamond studs featuring two matching round brilliant-cut diamonds. Equipped with secure friction push-backs, perfect for everyday wear.",
      price: 799.99,
      originalPrice: 899.99,
      isFeatured: false,
      isNew: true,
      isSale: false,
      categoryId: catEarrings.id,
      tags: [tagNew.id, tagDiamond.id, tagGift.id],
      colors: [
        { name: "White Gold", hex: "#F3ECE0" },
        { name: "Yellow Gold", hex: "#E5C453" }
      ],
      sizes: ["0.5 ctw", "1.0 ctw"],
      specifications: [
        { key: "Metal", value: "14K Gold" },
        { key: "Gemstone", value: "Matching Natural Diamonds" },
        { key: "Backing Style", value: "Friction Push-Back" }
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=800", alt: "Diamond Stud Earrings" }
      ],
      reviews: [
        { rating: 5, comment: "Pure class. Wore them to my wedding and got so many compliments.", userEmail: "john@zenvoraa.com" }
      ]
    },
    {
      name: "Textured Gold Hoop Earrings",
      slug: "textured-gold-hoop-earrings",
      excerpt: "Chic and lightweight textured hoop earrings.",
      description: "These stylish hoops are decorated with a subtle diamond-cut texture to catch and reflect light. Crafted in hollow 14K yellow gold to ensure they are lightweight for comfortable wear.",
      price: 149.99,
      originalPrice: 199.99,
      isFeatured: false,
      isNew: false,
      isSale: true,
      categoryId: catEarrings.id,
      tags: [tagSale.id, tagGold.id],
      colors: [
        { name: "Yellow Gold", hex: "#E5C453" }
      ],
      sizes: ["Small (20mm)", "Medium (30mm)", "Large (40mm)"],
      specifications: [
        { key: "Metal", value: "14K Yellow Gold" },
        { key: "Clasp", value: "Click-Top Post" },
        { key: "Type", value: "Hollow Lightweight Hoops" }
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800", alt: "Gold Hoop Earrings" }
      ],
      reviews: []
    },
    {
      name: "Premium Diamond Tennis Bracelet",
      slug: "premium-diamond-tennis-bracelet",
      excerpt: "Classic tennis bracelet featuring 3 carats of brilliant-cut diamonds.",
      description: "A dazzling strand of round brilliant-cut diamonds, hand-set in 14K white or yellow gold. Features a secure tongue-and-groove clasp with double safety latches.",
      price: 1899.99,
      originalPrice: 2199.99,
      isFeatured: true,
      isNew: false,
      isSale: false,
      categoryId: catBracelets.id,
      tags: [tagLuxury.id, tagDiamond.id, tagTrending.id],
      colors: [
        { name: "White Gold", hex: "#F3ECE0" },
        { name: "Yellow Gold", hex: "#E5C453" }
      ],
      sizes: ["7 inch", "7.5 inch"],
      specifications: [
        { key: "Metal", value: "14K Gold" },
        { key: "Total Diamond Weight", value: "3.0 tcw" },
        { key: "Clasp", value: "Box Clasp with Double Safety" }
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800", alt: "Diamond Tennis Bracelet" }
      ],
      reviews: []
    },
    {
      name: "Infinity Silver Bangle",
      slug: "infinity-silver-bangle",
      excerpt: "Sterling silver bangle with a delicate infinity loop design.",
      description: "This solid 925 sterling silver bangle features a beautiful infinity design in the center. Finished with a high-polish shine, it makes the perfect gift for someone special.",
      price: 89.99,
      originalPrice: 119.99,
      isFeatured: false,
      isNew: true,
      isSale: false,
      categoryId: catBracelets.id,
      tags: [tagNew.id, tagSilver.id, tagGift.id],
      colors: [
        { name: "Sterling Silver", hex: "#C0C0C0" }
      ],
      sizes: ["Standard"],
      specifications: [
        { key: "Metal", value: "925 Sterling Silver" },
        { key: "Finish", value: "High Polish Rhodium Plated" },
        { key: "Bangle Style", value: "Slip-on Stackable" }
      ],
      images: [
        { url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800", alt: "Silver Infinity Bangle" }
      ],
      reviews: []
    }
  ];

  for (const p of jewelryProductsData) {
    console.log(`Creating product: ${p.name}`);
    const createdProduct = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        excerpt: p.excerpt,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        isSale: p.isSale,
        status: "ACTIVE",
        forListing: true,
        brandId: brandZenVora.id,
        categoryId: p.categoryId,
        productTags: {
          create: p.tags.map(tId => ({ tagId: tId }))
        }
      }
    });

    // Create colors
    const colorRecords = [];
    for (const c of p.colors) {
      const colorRec = await prisma.productColor.create({
        data: {
          name: c.name,
          hex: c.hex,
          productId: createdProduct.id
        }
      });
      colorRecords.push(colorRec);
    }

    // Create sizes
    const sizeRecords = [];
    for (const s of p.sizes) {
      const sizeRec = await prisma.productSize.create({
        data: {
          value: s,
          productId: createdProduct.id
        }
      });
      sizeRecords.push(sizeRec);
    }

    // Create variants
    for (const colorRec of colorRecords) {
      for (const sizeRec of sizeRecords) {
        const cleanSize = sizeRec.value.replace(/\s+/g, "").replace(/[()]/g, "").toUpperCase();
        const cleanColor = colorRec.name.replace(/\s+/g, "").toUpperCase();
        const sku = `ZJV-${p.slug.substring(0, 5).toUpperCase()}-${cleanColor.substring(0, 3)}-${cleanSize.substring(0, 5)}`;
        await prisma.productVariant.create({
          data: {
            sku,
            price: p.price,
            stock: 50,
            productId: createdProduct.id,
            colorId: colorRec.id,
            sizeId: sizeRec.id
          }
        });
      }
    }

    // Create specifications
    if (p.specifications.length > 0) {
      await prisma.productSpecification.createMany({
        data: p.specifications.map(s => ({
          productId: createdProduct.id,
          key: s.key,
          value: s.value
        }))
      });
    }

    // Create reviews
    for (const rev of p.reviews) {
      const user = await prisma.user.findFirst({
        where: { email: rev.userEmail }
      });
      if (user) {
        await prisma.review.create({
          data: {
            rating: rev.rating,
            comment: rev.comment,
            userId: user.id,
            productId: createdProduct.id
          }
        });
      }
    }

    // Create images
    for (let i = 0; i < p.images.length; i++) {
      const img = p.images[i];
      if (!img) continue;
      const storageKey = `products/${createdProduct.id}/${i}`;
      const media = await prisma.media.create({
        data: {
          url: img.url,
          storageKey,
          altText: img.alt
        }
      });
      await prisma.productImage.create({
        data: {
          productId: createdProduct.id,
          mediaId: media.id,
          position: i + 1,
          isPrimary: i === 0
        }
      });
    }
  }

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
