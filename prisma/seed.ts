import { PrismaClient } from '@prisma/client';
import { DEFAULT_MEDIA_ASSETS } from '../src/common/constants/defaults.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Built-in Default Media Assets
  console.log('📸 Seeding default media assets...');
  for (const asset of DEFAULT_MEDIA_ASSETS) {
    const existing = await prisma.mediaAsset.findFirst({
      where: { publicId: asset.publicId },
    });

    if (!existing) {
      await prisma.mediaAsset.create({
        data: {
          name: asset.name,
          type: asset.type,
          provider: asset.provider,
          publicId: asset.publicId,
          url: asset.url,
          secureUrl: asset.secureUrl,
          metadata: asset.metadata,
          isDefault: true,
          userId: null,
        },
      });
      console.log(`  ✓ Created default asset: ${asset.name}`);
    } else {
      console.log(`  - Default asset already exists: ${asset.name}`);
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
