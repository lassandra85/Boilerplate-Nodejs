import type { Request, Response } from "express";

import prisma from "../../prisma/client.ts";

export const getAnnouncements = async (
  req: Request,
  res: Response,
) => {
  const {
    search,
    sort = "newest",
    page = 1,
  } = req.query as {
    search?: string;
    sort?: "newest" | "oldest";
    page?: number;
  };

  const pageNumber = Number(page);
  const skip = (pageNumber - 1) * 10;

  const where = search
    ? {
        title: {
          contains: search,
          mode: "insensitive" as const,
        },
      }
    : undefined;

  const orderBy = {
    createdAt: sort === "oldest" ? "asc" as const : "desc" as const,
  };

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy,
      skip,
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    }),

    prisma.announcement.count({
      where,
    }),
  ]);

  return res.status(200).json({
    items,
    total,
    page: pageNumber,
    perPage: 10,
    totalPages: Math.ceil(total / 10),
  });
};

export const getAnnouncement = async (
  req: Request,
  res: Response,
) => {
  const id = Number(req.params.id);

  const announcement = await prisma.announcement.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  if (!announcement) {
    return res.status(404).json({
      error: "Announcement not found",
    });
  }

  return res.status(200).json(announcement);
};

export const createAnnouncement = async (
  req: Request,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const { title, description, price, category } = req.body;

  const announcement = await prisma.announcement.create({
    data: {
      title,
      description,
      price,
      category,
      userId: req.user.sub,
    },
  });

  return res.status(201).json(announcement);
};

export const updateAnnouncement = async (
  req: Request,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const id = Number(req.params.id);

  const announcement = await prisma.announcement.findUnique({
    where: {
      id,
    },
  });

  if (!announcement) {
    return res.status(404).json({
      error: "Announcement not found",
    });
  }

  if (announcement.userId !== req.user.sub) {
    return res.status(403).json({
      error: "Access denied",
    });
  }

  const updated = await prisma.announcement.update({
    where: {
      id,
    },
    data: req.body,
  });

  return res.status(200).json(updated);
};

export const deleteAnnouncement = async (
  req: Request,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const id = Number(req.params.id);

  const announcement = await prisma.announcement.findUnique({
    where: {
      id,
    },
  });

  if (!announcement) {
    return res.status(404).json({
      error: "Announcement not found",
    });
  }

  if (announcement.userId !== req.user.sub) {
    return res.status(403).json({
      error: "Access denied",
    });
  }

  await prisma.announcement.delete({
    where: {
      id,
    },
  });

  return res.status(204).end();
};