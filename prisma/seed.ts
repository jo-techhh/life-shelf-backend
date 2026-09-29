import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_MEDIA_ASSETS } from '../src/common/constants/defaults.js';
import { env } from '../src/config/env.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Built-in Default Media Assets
  console.log('📸 Seeding default media assets...');
  let movieDefaultAssetId: string | null = null;
  let bookDefaultAssetId: string | null = null;

  for (const asset of DEFAULT_MEDIA_ASSETS) {
    let record = await prisma.mediaAsset.findFirst({
      where: { publicId: asset.publicId },
    });

    if (!record) {
      record = await prisma.mediaAsset.create({
        data: {
          name: asset.name,
          type: asset.type,
          provider: asset.provider,
          publicId: asset.publicId,
          url: asset.url,
          secureUrl: asset.secureUrl,
          metadata: asset.metadata,
          isDefault: true,
          isCatalog: true,
          userId: null,
        },
      });
      console.log(`  ✓ Created default asset: ${asset.name}`);
    } else {
      console.log(`  - Default asset already exists: ${asset.name}`);
    }

    if (asset.publicId === 'default_assets/movie_default') {
      movieDefaultAssetId = record.id;
    } else if (asset.publicId === 'default_assets/book_default') {
      bookDefaultAssetId = record.id;
    }
  }

  // 2. Seed Admin User
  console.log('👑 Seeding Admin user...');
  const adminEmail = env.ADMIN_EMAIL.toLowerCase();
  const adminUsername = env.ADMIN_USERNAME.toLowerCase();

  let adminUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { username: adminUsername }],
    },
  });

  if (!adminUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, salt);

    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        passwordHash,
        displayName: 'System Admin',
        role: Role.ADMIN,
      },
    });
    console.log(`  ✓ Created Admin user: ${adminEmail} (role: ADMIN)`);
  } else {
    if (adminUser.role !== Role.ADMIN) {
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: Role.ADMIN },
      });
      console.log(`  ✓ Upgraded existing user ${adminEmail} to role ADMIN`);
    } else {
      console.log(`  - Admin user already exists: ${adminEmail}`);
    }
  }

  // 3. Seed Popular Catalog Movies
  console.log('🎬 Seeding popular catalog movies...');
  const sampleMovies = [
    {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      releaseYear: 2010,
      language: 'English',
      duration: 148,
      director: 'Christopher Nolan',
      cast: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page, Tom Hardy',
      genre: 'Sci-Fi / Action',
    },
    {
      title: 'Interstellar',
      description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.',
      releaseYear: 2014,
      language: 'English',
      duration: 169,
      director: 'Christopher Nolan',
      cast: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
      genre: 'Sci-Fi / Adventure',
    },
    {
      title: 'The Dark Knight',
      description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      releaseYear: 2008,
      language: 'English',
      duration: 152,
      director: 'Christopher Nolan',
      cast: 'Christian Bale, Heath Ledger, Aaron Eckhart, Michael Caine',
      genre: 'Action / Crime / Drama',
    },
    {
      title: 'Parasite',
      description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
      releaseYear: 2019,
      language: 'Korean',
      duration: 132,
      director: 'Bong Joon Ho',
      cast: 'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong',
      genre: 'Drama / Thriller',
    },
  ];

  for (const movieData of sampleMovies) {
    const existing = await prisma.catalogMovie.findFirst({
      where: { title: movieData.title },
    });

    if (!existing) {
      await prisma.catalogMovie.create({
        data: {
          ...movieData,
          createdById: adminUser.id,
          mediaAssetId: movieDefaultAssetId,
        },
      });
      console.log(`  ✓ Created catalog movie: ${movieData.title}`);
    } else {
      console.log(`  - Catalog movie already exists: ${movieData.title}`);
    }
  }

  // 4. Seed Popular Catalog Books
  console.log('📚 Seeding popular catalog books...');
  const sampleBooks = [
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. Tiny changes yield remarkable results.',
      type: 'BOOK' as const,
      totalPages: 320,
      genre: 'Self-Help / Productivity',
    },
    {
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees.',
      type: 'BOOK' as const,
      totalPages: 464,
      genre: 'Software Engineering / Computer Science',
    },
    {
      title: 'Deep Work: Rules for Focused Success in a Distracted World',
      author: 'Cal Newport',
      description: 'Deep work is the ability to focus without distraction on a cognitively demanding task. It is a superpower in our increasingly competitive economy.',
      type: 'BOOK' as const,
      totalPages: 304,
      genre: 'Productivity / Non-Fiction',
    },
    {
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      description: 'The definitive guide to the architecture and internals of modern distributed systems, data processing, and storage engines.',
      type: 'BOOK' as const,
      totalPages: 616,
      genre: 'Computer Science / Distributed Systems',
    },
  ];

  for (const bookData of sampleBooks) {
    const existing = await prisma.catalogBook.findFirst({
      where: { title: bookData.title },
    });

    if (!existing) {
      await prisma.catalogBook.create({
        data: {
          ...bookData,
          createdById: adminUser.id,
          mediaAssetId: bookDefaultAssetId,
        },
      });
      console.log(`  ✓ Created catalog book: ${bookData.title}`);
    } else {
      console.log(`  - Catalog book already exists: ${bookData.title}`);
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
