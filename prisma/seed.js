import bcrypt from 'bcrypt';
import prisma from '../config/prisma.config.js';

async function main() {
  console.log("🌱 Start seeding...");

  await prisma.transactions.deleteMany();
  await prisma.orders.deleteMany();
  await prisma.wallets.deleteMany();
  await prisma.refresh_tokens.deleteMany();

  await prisma.users.deleteMany({
    where: {
      email: {
        in: ['user1@gmail.com', 'user2@gmail.com', 'user3@gmail.com', 'user4@gmail.com', 'user5@gmail.com'], // กำหนดอีเมล mock data ที่จะลบ
      },
    },
  });

  const passwordHash = await bcrypt.hash('12345678', 10);

  const users = [];
  for (let i = 1; i <= 5; i++) {
    users.push(
      await prisma.users.create({
        data: {
          email: `user${i}@gmail.com`,
          password: passwordHash,
          emailVerified: true,
        },
      })
    );
  }

  const currencies = ['BTC', 'ETH', 'XRP', 'DOGE'];

  const walletsData = [];
  users.forEach(user => {
    currencies.forEach(currency => {
      walletsData.push({
        userId: user.id,
        currency: currency,
        balance: parseFloat((1 + Math.random() * 10).toFixed(2)), 
      });
    });
  });

  await prisma.wallets.createMany({
    data: walletsData,
  });

  await prisma.orders.createMany({
    data: [
      {
        userId: users[0].id,
        type: 'SELL',
        currency: 'BTC',
        amount: 0.5 + Math.random() * 0.5,
        pricePerCoin: 1000000 + Math.random() * 500000,
        fiat: 'THB',
        status: 'ACTIVE',
      },
      {
        userId: users[1].id,
        type: 'SELL',
        currency: 'ETH',
        amount: 1 + Math.random(),
        pricePerCoin: 80000 + Math.random() * 20000,
        fiat: 'THB',
        status: 'ACTIVE',
      },
      {
        userId: users[2].id,
        type: 'BUY',
        currency: 'BTC',
        amount: 0.1 + Math.random() * 0.1,
        pricePerCoin: 950000 + Math.random() * 50000,
        fiat: 'THB',
        status: 'ACTIVE',
      },
      {
        userId: users[3].id,
        type: 'BUY',
        currency: 'ETH',
        amount: 0.2 + Math.random() * 0.3,
        pricePerCoin: 75000 + Math.random() * 15000,
        fiat: 'THB',
        status: 'ACTIVE',
      },
      {
        userId: users[4].id,
        type: 'SELL',
        currency: 'BTC',
        amount: 0.3 + Math.random() * 0.2,
        pricePerCoin: 1100000 + Math.random() * 100000,
        fiat: 'THB',
        status: 'ACTIVE',
      },
    ],
  });

  await prisma.transactions.createMany({
    data: [
      {
        senderId: users[0].id,
        receiverId: users[1].id,
        currency: 'BTC',
        amount: 0.1 + Math.random() * 0.1,
        isExternal: false,
      },
      {
        senderId: users[1].id,
        receiverId: null,
        externalAddress: `bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh${Math.floor(Math.random() * 100)}`,
        currency: 'BTC',
        amount: 0.2 + Math.random() * 0.2,
        isExternal: true,
      },
      {
        senderId: users[2].id,
        receiverId: null,
        externalAddress: `0x742d35Cc6634C0532925a3b844Bc454e4438f44e${Math.floor(Math.random() * 100)}`,
        currency: 'ETH',
        amount: 0.5 + Math.random() * 0.5,
        isExternal: true,
      },
      {
        senderId: users[3].id,
        receiverId: users[4].id,
        currency: 'ETH',
        amount: 0.1 + Math.random() * 0.2,
        isExternal: false,
      },
      {
        senderId: users[4].id,
        receiverId: null,
        externalAddress: `0x4E83362442f8E5e9a22b6fEF43353C77b636d65D${Math.floor(Math.random() * 100)}`,
        currency: 'BTC',
        amount: 0.15 + Math.random() * 0.1,
        isExternal: true,
      },
    ],
  });

  console.log("✅ Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
