import "dotenv/config";

import { BlogPostStatus, PrismaClient } from "@prisma/client";

import { seedBlogPosts } from "./seed-demo";

const prisma = new PrismaClient();

async function main() {
  await seedBlogPosts(prisma);

  const count = await prisma.blogPost.count({
    where: {
      status: BlogPostStatus.PUBLISHED,
    },
  });

  console.log(`${count} articles de blog publies disponibles en base.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
