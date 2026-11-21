/**
 * Creates the Shop filter tags from the ZenVoraa Figma design.
 *
 * A tag named "Group: Value" is shown in the Shop filter drawer under "Group".
 * This script only creates the tags (idempotent, safe to re-run); assign them
 * to products from Dashboard > Products. Run: pnpm seed:shop-tags
 */
import { prisma } from "../src/lib/prisma.js";

const groups: Record<string, string[]> = {
  Style: ["Contemporary", "Minimal", "Statement", "Floral"],
  Occasion: ["Everyday wear", "Party / Event", "Wedding"],
  Material: ["92.5% Silver", "9kt Gold", "18kt Gold", "Aluminium"],
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[.%]/g, "") // "92.5% Silver" -> "925 silver"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function main() {
  let created = 0;
  for (const [group, values] of Object.entries(groups)) {
    for (const value of values) {
      const name = `${group}: ${value}`;
      const slug = slugify(`${group} ${value}`);
      const existing = await prisma.tag.findFirst({ where: { OR: [{ name }, { slug }] } });
      if (existing) continue;
      await prisma.tag.create({ data: { name, slug } });
      created++;
      console.log(`+ ${name} (${slug})`);
    }
  }
  console.log(`Done. ${created} tag(s) created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
