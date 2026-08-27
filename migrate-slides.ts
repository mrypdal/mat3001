import { PrismaClient } from '@prisma/client';
import { slides } from './src/data/slides';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating slides...');
  
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    await prisma.slide.upsert({
      where: { originalId: slide.id },
      update: {
        title: slide.title,
        content: slide.content,
        order: i,
      },
      create: {
        originalId: slide.id,
        title: slide.title,
        content: slide.content,
        order: i,
      }
    });
  }

  console.log(`Migrated ${slides.length} slides.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
