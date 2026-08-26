import {
  type Account,
  Prisma,
  PrismaClient,
  type TransactionCategory,
  type TransactionDirection,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Deterministic demo data.
 *
 * Every value is derived from a fixed seed rather than `Math.random`, so the
 * dashboard charts look the same on every machine — a screenshot in the README
 * still matches what a reviewer sees after running this.
 */
let seedState = 1_337;
function nextRandom(): number {
  seedState = (seedState * 1_103_515_245 + 12_345) % 2 ** 31;
  return seedState / 2 ** 31;
}

function randomInt(min: number, max: number): number {
  return Math.floor(nextRandom() * (max - min + 1)) + min;
}

function pick<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length - 1)] as T;
}

const DEMO_PASSWORD = 'Password123!';

const SPENDING_PROFILE: ReadonlyArray<{
  category: TransactionCategory;
  counterparties: readonly string[];
  min: number;
  max: number;
}> = [
  { category: 'GROCERIES', counterparties: ['Fresh Market', 'GreenGrocer', 'DailyMart'], min: 12, max: 180 },
  { category: 'TRANSPORT', counterparties: ['MetroCard', 'CityRide', 'FuelStop'], min: 3, max: 75 },
  { category: 'UTILITIES', counterparties: ['PowerCo', 'AquaWorks', 'FibreNet'], min: 30, max: 210 },
  { category: 'ENTERTAINMENT', counterparties: ['StreamPlus', 'CineWorld', 'VinylShop'], min: 8, max: 95 },
  { category: 'HEALTHCARE', counterparties: ['CityPharmacy', 'DentalCare'], min: 15, max: 260 },
];

async function main(): Promise<void> {
  console.info('Resetting demo data…');
  // Order matters: children before parents, since a few relations are
  // deliberately restrictive rather than cascading.
  await prisma.transaction.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.account.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash(DEMO_PASSWORD, 12);

  const customer = await prisma.user.create({
    data: {
      email: 'customer@bank.test',
      passwordHash,
      fullName: 'Alex Customer',
      role: 'CUSTOMER',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@bank.test',
      passwordHash,
      fullName: 'Sam Staff',
      role: 'STAFF',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@bank.test',
      passwordHash,
      fullName: 'Robin Admin',
      role: 'ADMIN',
    },
  });

  const customerAccounts = await createAccounts(customer.id, [
    { nickname: 'Everyday Checking', type: 'CHECKING', balance: 8_450.35, accountNumber: '1000200030004001' },
    { nickname: 'Rainy Day Savings', type: 'SAVINGS', balance: 24_980.0, accountNumber: '1000200030004002' },
    { nickname: 'Travel Card', type: 'CREDIT', balance: 1_240.9, accountNumber: '1000200030004003' },
  ]);

  await createAccounts(staff.id, [
    { nickname: 'Staff Checking', type: 'CHECKING', balance: 3_120.0, accountNumber: '2000200030004001' },
  ]);

  await prisma.beneficiary.createMany({
    data: [
      { userId: customer.id, fullName: 'Jordan Lee', accountNumber: '5551234567', bankName: 'Northbank', isFavourite: true },
      { userId: customer.id, fullName: 'Priya Raman', accountNumber: '5559876543', bankName: 'Union Trust' },
      { userId: customer.id, fullName: 'Marco Diaz', accountNumber: '5554443332', bankName: 'Southbank' },
    ],
  });

  await seedTransactions(customerAccounts);

  console.info('Seed complete.');
  console.table([
    { email: customer.email, role: 'CUSTOMER', password: DEMO_PASSWORD },
    { email: staff.email, role: 'STAFF', password: DEMO_PASSWORD },
    { email: admin.email, role: 'ADMIN', password: DEMO_PASSWORD },
  ]);
}

async function createAccounts(
  userId: string,
  definitions: ReadonlyArray<{
    nickname: string;
    type: Account['type'];
    balance: number;
    accountNumber: string;
  }>,
): Promise<Account[]> {
  const created: Account[] = [];

  for (const definition of definitions) {
    created.push(
      await prisma.account.create({
        data: {
          userId,
          accountNumber: definition.accountNumber,
          nickname: definition.nickname,
          type: definition.type,
          balance: definition.balance,
          availableBalance: definition.balance,
          openedAt: new Date(Date.UTC(2021, 4, 17)),
        },
      }),
    );
  }

  return created;
}

/** Six months of plausible history so the dashboard charts have a real shape. */
async function seedTransactions(accounts: Account[]): Promise<void> {
  const checking = accounts[0];
  if (!checking) return;

  const rows: Prisma.TransactionCreateManyInput[] = [];
  const now = new Date();

  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo -= 1) {
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));

    rows.push({
      accountId: checking.id,
      direction: 'CREDIT' satisfies TransactionDirection,
      amount: new Prisma.Decimal(5_200),
      category: 'SALARY',
      description: 'Monthly salary',
      counterparty: 'Acme Corporation',
      bookedAt: new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1, 9)),
    });

    const purchaseCount = randomInt(14, 22);
    for (let index = 0; index < purchaseCount; index += 1) {
      const profile = pick(SPENDING_PROFILE);
      const day = randomInt(1, 27);

      rows.push({
        accountId: checking.id,
        direction: 'DEBIT' satisfies TransactionDirection,
        amount: new Prisma.Decimal(randomInt(profile.min * 100, profile.max * 100)).div(100),
        category: profile.category,
        description: `${profile.category.toLowerCase()} purchase`,
        counterparty: pick(profile.counterparties),
        bookedAt: new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day, randomInt(8, 21))),
      });
    }
  }

  await prisma.transaction.createMany({ data: rows });
  console.info(`Inserted ${rows.length} transactions.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
