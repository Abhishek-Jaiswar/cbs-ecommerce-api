import { prisma } from "../src/lib/prisma.js";

async function main() {
  try {
    const all = await prisma.announcement.findMany();
    console.log("All announcements in database:", all);
  } catch (error) {
    console.error("Database query failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
