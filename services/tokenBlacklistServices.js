import { prisma } from "../config/db.js";

export const addTokenToBlacklist = async (token, expiresAt) => {
  return prisma.tokenBlacklist.create({
    data: { token, expiresAt }
  });
};

export const isTokenBlacklisted = async (token) => {
  const found = await prisma.tokenBlacklist.findUnique({ where: { token } });
  return !!found;
};