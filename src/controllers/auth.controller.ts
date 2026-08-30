import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import prisma from "../../prisma/client.ts";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const ACCESS_TOKEN_EXPIRES_IN = "15m";

const generateAccessToken = (user: {
  id: number;
  username: string;
}) => {
  return jwt.sign(
    {
      username: user.username,
    },
    JWT_SECRET,
    {
      subject: String(user.id),
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    },
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const createTokens = async (user: {
  id: number;
  username: string;
}) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
    },
  });

  return {
    accessToken,
    refreshToken,
  };
};

export const register = async (req: Request, res: Response) => {
  const { username, email, password, name } = req.body;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (existingUser) {
    return res.status(409).json({
      error: "Username or email already taken",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      name,
    },
  });

  const tokens = await createTokens(user);

  return res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    },
    ...tokens,
  });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const passwordValid = await bcrypt.compare(password, user.password);

  if (!passwordValid) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  await prisma.refreshToken.deleteMany({
    where: {
      userId: user.id,
    },
  });

  const tokens = await createTokens(user);

  return res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    },
    ...tokens,
  });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const tokenRecord = await prisma.refreshToken.findUnique({
    where: {
      token: refreshToken,
    },
  });

  if (!tokenRecord) {
    return res.status(401).json({
      error: "Invalid refresh token",
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: tokenRecord.userId,
    },
  });

  if (!user) {
    return res.status(401).json({
      error: "Invalid refresh token",
    });
  }

  await prisma.refreshToken.delete({
    where: {
      id: tokenRecord.id,
    },
  });

  const tokens = await createTokens(user);

  return res.status(200).json(tokens);
};

export const logout = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  await prisma.refreshToken.deleteMany({
    where: {
      userId: req.user.sub,
    },
  });

  return res.status(204).end();
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: req.user.sub,
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(401).json({
      error: "User not found",
    });
  }

  return res.status(200).json(user);
};