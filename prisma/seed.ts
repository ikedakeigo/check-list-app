import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { supabaseUserId: "1" }, // 一意のキーを指定
    update: {}, // 既存の場合は更新しない
    create: {
      name: "Test User",
      supabaseUserId: randomUUID(), // 仮のID
      role: "user",
    },
  });
  console.log({ user });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
