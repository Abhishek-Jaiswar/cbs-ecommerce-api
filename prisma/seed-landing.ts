import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("Starting landing pages database seeding...");

  // 1. Clean existing landing page data
  console.log("Cleaning old landing page data...");
  await prisma.landingPage.deleteMany();

  // 2. Create Default Landing Page Slides
  console.log("Seeding default Hero Slider pages...");
  const defaultSlidesData = [
    {
      title: "Affordable Luxury",
      slug: "affordable-luxury",
      description: "Carefully curated premium imitation jewelry designed to complement every occasion, letting you shine with confidence.",
      imageUrl: "/corano/slider/slider-1.png",
      imagePublicId: "landing-pages/slider-1",
      isPublished: true,
      sections: {
        align: "left",
        titleAccent: "Timeless Elegance",
        ctaText: "Shop Collection",
        ctaLink: "/shop"
      }
    },
    {
      title: "Curated Fashion",
      slug: "curated-fashion",
      description: "From everyday simplicity to festive celebration pieces, discover artificial jewelry that reflects the latest fashion trends.",
      imageUrl: "/corano/slider/slider-2.png",
      imagePublicId: "landing-pages/slider-2",
      isPublished: true,
      sections: {
        align: "right",
        titleAccent: "Everyday Glamour",
        ctaText: "Explore Trends",
        ctaLink: "/shop"
      }
    },
    {
      title: "Exquisite Finish",
      slug: "exquisite-finish",
      description: "Handpicked premium artificial accessories crafted with exceptional durability, meticulous detail, and lasting finish.",
      imageUrl: "/corano/slider/slider-3.png",
      imagePublicId: "landing-pages/slider-3",
      isPublished: true,
      sections: {
        align: "left",
        titleAccent: "Master Artistry",
        ctaText: "Discover Now",
        ctaLink: "/shop"
      }
    }
  ];

  for (const slide of defaultSlidesData) {
    console.log(`Creating landing page banner: ${slide.title}`);
    await prisma.landingPage.create({
      data: slide
    });
  }

  console.log("Landing pages database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding landing pages database: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
