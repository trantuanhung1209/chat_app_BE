import { prisma } from "../config/db.js";
import logger from '../config/logger.js';

export const addTokenToBlacklist = async (token, expiresAt) => {
  try {
    const result = await prisma.tokenBlacklist.create({
      data: { token, expiresAt }
    });
    logger.info('add_token_blacklist_success', { token, expiresAt });
    return result;
  } catch (error) {
    logger.error('add_token_blacklist_failed', {
      token,
      status_code: 500,
      error: { name: error.name, message: error.message }
    });
    throw error;
  }
};

export const isTokenBlacklisted = async (token) => {
  try {
    const found = await prisma.tokenBlacklist.findUnique({ where: { token } });
    if (found) {
      logger.info('token_is_blacklisted', { token });
    }
    return !!found;
  } catch (error) {
    logger.error('check_token_blacklist_failed', {
      token,
      status_code: 500,
      error: { name: error.name, message: error.message }
    });
    throw error;
  }
};