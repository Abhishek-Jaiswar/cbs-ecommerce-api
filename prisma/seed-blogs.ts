import { prisma } from "../src/lib/prisma.js";
import argon2 from "argon2";

async function main() {
  console.log("Starting blog database seeding...");

  // 1. Clean existing blog data (safe because blogs don't have FK blocks on other systems)
  console.log("Cleaning old blog data...");
  await prisma.blogPost.deleteMany();
  await prisma.blogCategory.deleteMany();
  await prisma.blogTag.deleteMany();

  // 2. Get or create Admin User
  let adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" }
  });

  if (!adminUser) {
    console.log("No ADMIN user found, creating a default one...");
    const hashedPassword = await argon2.hash("password123", {
      type: argon2.argon2id,
    });
    adminUser = await prisma.user.create({
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
  }

  console.log(`Using Admin User: ${adminUser.email} (${adminUser.id})`);

  // 3. Create Blog Categories
  console.log("Seeding Blog Categories...");
  const bCatTrends = await prisma.blogCategory.create({
    data: { name: "Trends & Style", slug: "trends-style" }
  });
  const bCatCare = await prisma.blogCategory.create({
    data: { name: "Jewelry Care", slug: "jewelry-care" }
  });
  const bCatCraft = await prisma.blogCategory.create({
    data: { name: "Craftsmanship", slug: "craftsmanship" }
  });
  const bCatBridal = await prisma.blogCategory.create({
    data: { name: "Bridal Collections", slug: "bridal-collections" }
  });

  // 4. Create Blog Tags
  console.log("Seeding Blog Tags...");
  const bTagStyling = await prisma.blogTag.create({
    data: { name: "Styling", slug: "styling" }
  });
  const bTagDiamonds = await prisma.blogTag.create({
    data: { name: "Diamonds", slug: "diamonds" }
  });
  const bTagGold = await prisma.blogTag.create({
    data: { name: "Gold", slug: "gold" }
  });
  const bTagSilver = await prisma.blogTag.create({
    data: { name: "Silver", slug: "silver" }
  });
  const bTagBridal = await prisma.blogTag.create({
    data: { name: "Bridal", slug: "bridal" }
  });
  const bTagGifts = await prisma.blogTag.create({
    data: { name: "Gifts", slug: "gifts" }
  });

  // 5. Create 8 Blog Posts
  console.log("Seeding Blog Posts...");
  const blogPostsData = [
    {
      title: "The Ultimate Guide to Diamond Cuts: Finding Your Perfect Sparkle",
      slug: "the-ultimate-guide-to-diamond-cuts-finding-your-perfect-sparkle",
      excerpt: "Explore the characteristics, sparkle levels, and histories of the most popular diamond cuts to choose the perfect stone for your jewelry.",
      content: `Choosing a diamond is one of the most significant decisions in jewelry selection. While many focus on carat weight, the **cut** of a diamond has the single greatest impact on its brilliance, fire, and overall beauty.

In this guide, we break down the most popular diamond cuts, their characteristics, and how to find the perfect sparkle for your taste.

## Understanding the "Four Cs" of Diamond Cut
Before diving into shapes, it is crucial to understand that "cut" refers to two things:
1. **The Shape**: Round, Princess, Emerald, etc.
2. **The Cut Quality**: How well the diamond’s facets interact with light.

A well-cut diamond reflects light from one facet to another and projects it out through the top of the stone. An poorly cut diamond lets light leak out of the sides or bottom.

---

## Popular Diamond Cuts & Their Sparkle Profile

| Diamond Cut | Sparkle Level | Style Persona | Best Suited For |
| :--- | :--- | :--- | :--- |
| **Round Brilliant** | Maximum (10/10) | Classic, Timeless | Solitaire Rings, Studs |
| **Princess** | High (8/10) | Modern, Geometric | Engagement Rings |
| **Cushion** | Warm (8/10) | Vintage, Romantic | Halo Designs |
| **Emerald** | Lustrous (6/10) | Elegant, Sophisticated | Art Deco Settings |
| **Oval** | High (9/10) | Trendy, Elongating | Modern Solitaires |

---

## Deep Dive Into Key Shapes

### 1. The Classic Round Brilliant
The undisputed king of sparkle. Consisting of 58 facets, it is engineered for maximum light return. 
> "Over 75% of engagement rings sold worldwide feature a round brilliant diamond."

### 2. The Modern Princess Cut
With its clean square lines and intense sparkle, the Princess cut offers a contemporary alternative to the round brilliant. It works exceptionally well in modern, minimalist settings.

### 3. The Vintage Cushion Cut
Once known as the *pillow cut*, the cushion cut features rounded corners and larger facets, which create a "crushed ice" look and showcase the diamond's fire (colored flashes of light).

### 4. The Elegant Emerald Cut
Unlike brilliant cuts, the emerald cut is a *step cut* with long parallel facets. It acts as a hall of mirrors, highlighting the clarity and purity of the stone rather than raw sparkle.

---

## Pro Tips for Choosing a Diamond Cut
* **Prioritize Cut Quality Over Carat**: A slightly smaller, exceptionally cut diamond will look larger and brighter than a larger, poorly cut diamond.
* **Match the Metal**: Platinum and white gold enhance the cool brilliance of colorless diamonds, while yellow and rose gold add warmth.
* **Check the Symmetry**: Perfect alignment of facets creates harmonious light reflection.

Ready to find your perfect gemstone? Browse our premium [Rings collection](/shop?category=rings) to see these cuts handcrafted in solid gold and platinum settings.`,
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
      storageKey: "blogs/diamond-cuts-guide",
      altText: "A sparkling solitaire diamond engagement ring on a dark reflective surface",
      isFeatured: true,
      categoryId: bCatTrends.id,
      tags: [bTagDiamonds, bTagStyling]
    },
    {
      title: "How to Care for Your Handcrafted Sterling Silver Jewelry",
      slug: "how-to-care-for-your-handcrafted-sterling-silver-jewelry",
      excerpt: "Keep your sterling silver pieces shining like new with our professional cleaning, storage, and maintenance tips.",
      content: `Sterling silver is a beloved precious metal known for its brilliant white luster and versatility. However, silver is naturally prone to tarnishing when exposed to moisture, air, and certain chemicals.

Fortunately, with proper care and regular maintenance, you can keep your sterling silver jewelry shining beautifully for a lifetime. Here is our comprehensive care guide.

## Why Sterling Silver Tarnishes
Sterling silver is an alloy containing **92.5% pure silver** and **7.5% other metals** (usually copper). The copper reacts with sulfur compounds in the air, creating silver sulfide—the dark tarnish that accumulates on the surface.

> **Note:** Tarnishing is a natural chemical process, not a sign of poor quality or defective silver!

---

## Daily Wear Rules for Silver

To minimize tarnish, keep these three simple rules in mind:
1. **Last On, First Off**: Apply perfumes, lotions, hairsprays, and makeup *before* putting on your jewelry.
2. **Remove Before Wetting**: Do not wear silver in swimming pools, hot tubs, showers, or when washing dishes. Chlorine and soaps speed up tarnishing.
3. **Avoid Sweat**: Take off your jewelry before working out, as sweat contains salts that accelerate corrosion.

---

## How to Clean Your Silver Jewelry Safely

### 1. The Gentle Wipe (Regular Care)
After wearing, wipe your jewelry gently with a **special micro-fiber polishing cloth**. Never use paper towels, tissues, or rough cloths as they can scratch the soft surface of the silver.

### 2. Soap and Water (Light Tarnish)
For mild tarnishing:
* Mix a few drops of **mild dish soap** with warm water.
* Soak the jewelry for 5-10 minutes.
* Use a **soft-bristled toothbrush** to clean tight crevices.
* Rinse thoroughly and dry completely with a clean cloth.

### 3. The Baking Soda Solution (Deep Clean)
For heavy tarnish, use this non-toxic household method:
* Line a glass dish with **aluminum foil** (shiny side up).
* Place your jewelry on the foil.
* Sprinkle a generous layer of **baking soda** over the pieces.
* Pour **boiling water** over it until covered.
* Let it sit for 2-5 minutes as the tarnish transfers to the foil.
* Rinse well and dry.

---

## Safe Storage Solutions
When you're not wearing your silver, store it properly to prevent tarnishing:
* **Air-tight is Best**: Use small Ziploc bags or specialized jewelry pouches.
* **Keep Pieces Separate**: Store items individually to prevent scratching.
* **Add Silica Gel**: Toss a silica gel packet into your jewelry box to absorb moisture.

By following these simple guidelines, your favorite silver pieces will remain as radiant as the day you unboxed them. Explore our handcrafted [Sterling Silver Collections](/shop?tag=silver) today!`,
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800",
      storageKey: "blogs/silver-jewelry-care",
      altText: "Handcrafted sterling silver bangles stacked elegantly on a marble table",
      isFeatured: false,
      categoryId: bCatCare.id,
      tags: [bTagSilver, bTagGifts]
    },
    {
      title: "Bridal Jewelry Trends: From Classic Pearls to Modern Halos",
      slug: "bridal-jewelry-trends-from-classic-pearls-to-modern-halos",
      excerpt: "Discover the latest bridal jewelry trends of the season, helping brides select the perfect accessories to complement their gowns.",
      content: `Your wedding day is one of the most memorable milestones of your life, and every detail of your bridal look should reflect your unique personality. While the dress takes center stage, bridal jewelry is the finishing touch that brings the entire ensemble together.

From vintage revival to minimalist elegance, here are the top bridal jewelry trends of the season.

## 1. Classic Pearl Renaissance
Pearls are back, but with a modern twist. Brides are choosing baroque pearls, drop earrings, and layered pearl chokers over the traditional single-strand necklaces.
* **The Look**: Timeless, romantic, and organic.
* **Pairs Well With**: Sweetheart necklines and lace gowns.

---

## 2. Modern Halo Settings
Halo rings, where a central gemstone is encircled by a border of smaller accent diamonds, continue to dominate. Today's brides are opting for *floral halos* and *sunburst halos* that offer a bohemian or art-deco aesthetic.

> "A halo setting not only adds incredible sparkle but also makes the central diamond appear up to 50% larger."

---

## 3. Mixing Metals
The old rule of matching all jewelry metals is gone. Modern brides are beautifully pairing platinum engagement rings with yellow gold wedding bands, or layering white and rose gold necklaces.
* **How to Pull it Off**: Maintain a cohesive style theme (e.g., all delicate pieces or all vintage designs) even if the metals vary.

---

## Matching Jewelry to Your Wedding Neckline

| Neckline Style | Recommended Jewelry | Styling Tip |
| :--- | :--- | :--- |
| **Strapless** | Statement Choker or Collar | Let the collar bone stand out; skip long dangles. |
| **V-Neck** | Delicate Pendant & Drop Earrings | Choose a pendant that mimics the V-shape. |
| **High Neck** | Statement Earrings & Bracelet | Avoid necklaces; focus on sparkling ear candy. |
| **Off-the-Shoulder** | Classic Studs & Tennis Bracelet | A clean, elegant look that showcases the shoulders. |

---

## Choosing Your Bridal Jewelry Checklist
* **Don't Over-Accessorize**: Let either your dress or one major piece of jewelry be the focal point.
* **Express Yourself**: If you wear minimal jewelry daily, don't wear heavy chandeliers on your wedding day. Be comfortable.
* **Check the Gown's Tone**: White gowns look best with platinum and silver. Ivory and cream gowns look gorgeous with yellow gold.

Celebrate your love story with pieces that stand the test of time. Discover our curated [Bridal Jewellery Designs](/shop?tag=luxury) to discover your bridal sparkles.`,
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800",
      storageKey: "blogs/bridal-trends",
      altText: "A collection of bridal pearl jewelry including a necklace and earrings on a silk background",
      isFeatured: false,
      categoryId: bCatBridal.id,
      tags: [bTagBridal, bTagGold, bTagStyling]
    },
    {
      title: "The Art of Layering: A Modern Guide to Necklace Stacking",
      slug: "the-art-of-layering-a-modern-guide-to-necklace-stacking",
      excerpt: "Learn how to stack and layer necklaces like a professional stylist to add depth, texture, and style to any outfit.",
      content: `Necklace layering is one of the most versatile styling techniques. By combining different lengths, weights, and textures, you can transform simple chains into a personalized statement.

However, creating the perfect "neck-cessory stack" requires a bit of balance to avoid tangles and clutter. Here is our step-by-step styling guide.

## The Layering Formula: 3 Essential Pieces

A balanced stack typically consists of three components:

### 1. The Base (14" - 16")
Start with a short, thin chain or a delicate choker. This sits high on the collarbone and defines the starting point of your stack.
* **Ideal Styles**: Paperclip chains, cable chains, or delicate bead necklaces.

### 2. The Texture (18")
The middle piece should add visual interest. Choose a chain with a different texture or thickness to create depth.
* **Ideal Styles**: Herringbone chains, rope chains, or small pendants.

### 3. The Statement (20" - 24")
The final layer should be the longest and feature a distinct pendant or coin. This draws the eye down and anchors the entire stack.
* **Ideal Styles**: Medallions, bar pendants, or locket necklaces.

---

## Pro Stacking Rules

### Rule #1: Mix Your Weights
If you stack three ultra-thin chains, they are highly likely to tangle. Pair a heavier herringbone chain with a lightweight pendant chain to keep them separated.

### Rule #2: Space it Out
Leave at least 2 inches of space between each layer to give each piece breathing room.
> "Standard Length Guide: 16\" (Base) \u2192 18\" (Texture) \u2192 20\" (Statement)."

### Rule #3: Keep the Outfit Simple
Layered necklaces look best against a neutral backdrop—like a plain white tee, a black turtleneck, or a simple V-neck blouse.

---

## Layering Cheat Sheet

| Layer | Recommended Length | Style Option |
| :--- | :--- | :--- |
| **First Layer** | 16 Inches | Simple 14K Gold Cable Chain |
| **Second Layer** | 18 Inches | 3.5mm Gold Herringbone Chain |
| **Third Layer** | 20 Inches | Round Coin/Medallion Pendant |

Ready to build your signature stack? Mix and match our handcrafted [Necklaces and Chains](/shop?category=necklaces) to find your perfect combination.`,
      image: "https://images.unsplash.com/photo-1611085583191-a3b1a30a8a3a?w=800",
      storageKey: "blogs/necklace-stacking",
      altText: "Close-up of a model wearing multiple layered gold chains and pendants",
      isFeatured: false,
      categoryId: bCatTrends.id,
      tags: [bTagStyling, bTagGold]
    },
    {
      title: "Why Handcrafted Jewelry Makes the Perfect Meaningful Gift",
      slug: "why-handcrafted-jewelry-makes-the-perfect-meaningful-gift",
      excerpt: "Discover why choosing handcrafted jewelry over mass-produced items makes a gift significantly more special and memorable.",
      content: `Gift-giving is an art form. It's a way to say "I know you, I value you, and I care." While mass-produced items are convenient, they often lack a personal connection.

Handcrafted jewelry, on the other hand, carries a story, a soul, and a level of care that makes it the ultimate meaningful gift. Here is why.

## 1. No Two Pieces Are Identical
When a jeweler crafts an item by hand, subtle variations occur in every hammer strike, solder point, and stone setting. This means the recipient receives a **one-of-a-kind piece** created just for them.
> "There is a profound beauty in owning something that nobody else in the world has."

---

## 2. Uncompromising Quality and Attention to Detail
Mass manufacturing lines prioritize speed. Independent artisans, however, prioritize **perfection**. Every facet is examined, every edge is polished by hand, and every stone is secured manually. Handcrafted pieces are built to last generations, transforming them from simple gifts into family heirlooms.

---

## 3. Ethical and Sustainable Craftsmanship
Most handcrafted jewelry is made in small batches or on-demand, which significantly reduces waste. Artisans are also much more likely to use ethically sourced gemstones, recycled precious metals, and local suppliers, making your gift kinder to the planet.

---

## How to Match the Gift to the Recipient

* **For the Minimalist**: A delicate sterling silver bangle or classic diamond studs.
* **For the Statement Maker**: A bold sapphire halo ring or a chunkier layered chain.
* **For the Romantic**: A pearl pendant or a vintage-inspired design in rose gold.

This gift-giving season, choose a present with a heartbeat. Explore our handcrafted [Jewelry Catalog](/shop) to find a treasure they will cherish forever.`,
      image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800",
      storageKey: "blogs/handcrafted-gift",
      altText: "A beautifully packaged jewelry gift box on a soft silk ribbon",
      isFeatured: false,
      categoryId: bCatCraft.id,
      tags: [bTagGifts, bTagSilver]
    },
    {
      title: "Gold Vermeil vs. Gold Plated: What is the Difference?",
      slug: "gold-vermeil-vs-gold-plated-what-is-the-difference",
      excerpt: "Demystify gold jewelry types. Learn the differences between gold vermeil, gold plated, and solid gold to make smart purchasing decisions.",
      content: `When shopping for gold jewelry, you will encounter terms like *solid gold*, *gold filled*, *gold vermeil*, and *gold plated*. While they may look similar on the surface, they differ significantly in composition, durability, price, and care requirements.

Understanding these differences is key to choosing the right jewelry for your budget and lifestyle. Let's compare them.

## The Gold Jewelry Spectrum

### 1. Solid Gold
The gold standard of jewelry. It is durable, does not tarnish, and maintains its value over time. However, it is the most expensive option.

### 2. Gold Vermeil (pronounced *ver-may*)
Gold vermeil is high-quality sterling silver coated with a thick layer of gold. To be legally classified as vermeil:
* The base metal must be **925 Sterling Silver**.
* The gold coating must be at least **2.5 microns thick**.
* The gold used must be at least **10K or higher**.

### 3. Gold Plated
Gold-plated jewelry features a thin layer of gold chemically bonded to a base metal like brass, copper, or steel. The gold layer is typically very thin (less than 0.5 microns) and can wear off quickly with daily wear.

---

## Comparison Table

| Feature | Solid Gold | Gold Vermeil | Gold Plated |
| :--- | :--- | :--- | :--- |
| **Base Metal** | None (Gold Alloy) | 925 Sterling Silver | Brass, Copper, or Steel |
| **Gold Thickness**| Solid | \u2265 2.5 Microns | < 0.5 Microns |
| **Hypoallergenic**| Yes | Yes | Often No (contains nickel) |
| **Durability** | Lifetime | High (years of wear) | Low (months of wear) |
| **Price Point** | Premium ($$$$) | Moderate ($$) | Budget ($) |

---

## Which One Should You Buy?
* **Buy Solid Gold** for engagement rings, wedding bands, or milestone gifts meant to last a lifetime.
* **Buy Gold Vermeil** for high-quality, hypoallergenic fashion jewelry that offers the luxury look of solid gold at an affordable price.
* **Avoid Gold Plated** if you have sensitive skin, as the plating wears away quickly and exposes the reactive base metals underneath.

At ZenVora, we specialize in high-quality gold vermeil and solid gold designs. View our gold items in the [Luxury Tag Collection](/shop?tag=gold) today!`,
      image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800",
      storageKey: "blogs/gold-vermeil-guide",
      altText: "Lustrous gold jewelry pieces showcased on a sand surface",
      isFeatured: false,
      categoryId: bCatCraft.id,
      tags: [bTagGold, bTagDiamonds]
    },
    {
      title: "How to Choose the Perfect Gemstone for Your Zodiac Sign",
      slug: "how-to-choose-the-perfect-gemstone-for-your-zodiac-sign",
      excerpt: "Align your jewelry with the stars. Learn about the birthstones and gemstones that match your zodiac sign's unique energy.",
      content: `For centuries, cultures around the world have believed that gemstones hold unique energies and vibrations. Aligning your jewelry with your astrological chart is a beautiful way to personalize your style and invite positive energy into your life.

Whether you're looking for a personal talisman or a meaningful gift, here is how to choose the perfect gemstone for your zodiac sign.

## Fire Signs: Passion and Energy
* **Aries (March 21 - April 19) \u2014 Diamond**: Reflects the strength, clarity, and bold spirit of the ram.
* **Leo (July 23 - August 22) \u2014 Ruby**: Ignites passion and confidence, matching the lion's warm-hearted energy.
* **Sagittarius (November 22 - December 21) \u2014 Turquoise**: Promotes wisdom, protection, and adventure.

---

## Earth Signs: Grounded and Practical
* **Taurus (April 20 - May 20) \u2014 Emerald**: Symbolizes growth, abundance, and a love for luxury and nature.
* **Virgo (August 23 - September 22) \u2014 Sapphire**: Inspires mental clarity, focus, and quiet elegance.
* **Capricorn (December 22 - January 19) \u2014 Garnet**: Offers grounding energy, strength, and steady progress.

---

## Air Signs: Intellectual and Communicative
* **Gemini (May 21 - June 20) \u2014 Pearl**: Balances dual energies and represents wisdom and communication.
* **Libra (September 23 - October 22) \u2014 Opal**: Attracts harmony, beauty, and balance in relationships.
* **Aquarius (January 20 - February 18) \u2014 Amethyst**: Encourages spiritual awareness, peace, and original ideas.

---

## Water Signs: Emotional and Intuitive
* **Cancer (June 21 - July 22) \u2014 Ruby / Moonstone**: Provides emotional balance, protection, and feeds the intuition.
* **Scorpio (October 23 - November 21) \u2014 Aquamarine / Topaz**: Calms intense feelings and promotes truth and clarity.
* **Pisces (February 19 - March 20) \u2014 Aquamarine**: Connects to the ocean's depth, inspiring creativity and peace.

---

> "Wearing your zodiac stone is a daily reminder of your inner strength and cosmic alignment."

Find your astrological match today. Check out our detailed collections in the [Store Catalog](/shop) and discover your personal gemstone.`,
      image: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800",
      storageKey: "blogs/zodiac-gemstones",
      altText: "A collection of colorful raw gemstones and crystals on a velvet surface",
      isFeatured: false,
      categoryId: bCatTrends.id,
      tags: [bTagStyling, bTagGifts]
    },
    {
      title: "Minimalist Jewelry: Crafting a Capsule Collection",
      slug: "minimalist-jewelry-crafting-a-capsule-collection",
      excerpt: "Design a timeless, versatile jewelry wardrobe with five key pieces that elevate any outfit effortlessly.",
      content: `In the world of fashion, "less is more" is a timeless philosophy. Just like a capsule clothing wardrobe, a **jewelry capsule collection** consists of a few high-quality, versatile pieces that can be mixed, matched, and worn daily.

Investing in a few premium minimalist pieces ensures you always look put-together without clutter. Here are the five essentials to build your collection.

## 1. The Everyday Studs
A pair of simple studs is the foundation of any jewelry wardrobe. They add a touch of sparkle without overpowering your look.
* **Recommendation**: Classic diamond or cubic zirconia studs set in white or yellow gold.

---

## 2. The Delicate Chain
A simple, fine chain in 14K gold or sterling silver can be worn alone for a minimalist look, or stacked with pendants for a casual weekend style.

---

## 3. The Classic Band Ring
A plain metal band or a delicate pav\u00e9 ring can be worn on any finger. Stacking them creates a textured, modern look.
* **Style Tip**: Mix silver and gold bands on the same finger for a chic, trendy edge.

---

## 4. The Structured Bangle or Cuff
A simple metal bangle adds structure to your wrists and works with everything from office blazers to silk slip dresses.

---

## 5. The Elegant Hoops
Small to medium hoops (20mm - 30mm) are incredibly versatile. They easily transition from day to night and frame the face beautifully.

---

## How to Curate Your Collection: 3 Rules

1. **Prioritize Metals Over Price**: Choose gold vermeil or sterling silver over cheap fashion metals so your capsule doesn't tarnish or discolor your skin.
2. **Stick to one Dominant Tone**: If you prefer cool tones, let 80% of your capsule be silver or platinum. If you like warmth, focus on gold.
3. **Comfort is Key**: If a bracelet is too heavy or a ring catches on clothing, you won't wear it daily. Choose pieces that feel like a second skin.

Build your perfect daily look with ZenVora's minimalist designs. Visit our [Storefront](/shop) to select your capsule pieces.`,
      image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800",
      storageKey: "blogs/jewelry-capsule",
      altText: "Delicate gold hoops and stacked rings laying on a clean white linen fabric",
      isFeatured: false,
      categoryId: bCatTrends.id,
      tags: [bTagStyling, bTagSilver, bTagGold]
    }
  ];

  for (const post of blogPostsData) {
    console.log(`Creating blog post: ${post.title}`);
    await prisma.blogPost.create({
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        image: post.image,
        storageKey: post.storageKey,
        altText: post.altText,
        status: "PUBLISHED",
        isFeatured: post.isFeatured,
        publishedAt: new Date(),
        author: {
          connect: { id: adminUser.id }
        },
        category: {
          connect: { id: post.categoryId }
        },
        tags: {
          connect: post.tags.map(t => ({ id: t.id }))
        }
      }
    });
  }

  console.log("Blog database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during blog seeding: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
