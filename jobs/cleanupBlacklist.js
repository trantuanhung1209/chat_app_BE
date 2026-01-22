import cron from "node-cron";
import { prisma } from "../config/db.js";

// Chạy mỗi ngày lúc 2h sáng
cron.schedule("0 2 * * *", async () => {
  const now = new Date();
  // Xóa token đã hết hạn hơn 1 ngày
  const result = await prisma.tokenBlacklist.deleteMany({
    where: {
      expiresAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    }
  });
  console.log(`[CRON] Deleted ${result.count} expired blacklisted tokens`);
});