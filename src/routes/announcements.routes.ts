import { Router } from "express";

import {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcements.controller.ts";

import {
  announcementIdSchema,
  announcementQuerySchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "../validators/announcements.validator.ts";

import { validateBody, validateParams, validateQuery } from "../middleware/validate.ts";
import { authenticate } from "../middleware/authenticate.ts";

const router = Router();

router.get(
  "/",
  validateQuery(announcementQuerySchema),
  getAnnouncements,
);

router.get(
  "/:id",
  validateParams(announcementIdSchema),
  getAnnouncement,
);

router.post(
  "/",
  authenticate,
  validateBody(createAnnouncementSchema),
  createAnnouncement,
);

router.patch(
  "/:id",
  authenticate,
  validateParams(announcementIdSchema),
  validateBody(updateAnnouncementSchema),
  updateAnnouncement,
);

router.delete(
  "/:id",
  authenticate,
  validateParams(announcementIdSchema),
  deleteAnnouncement,
);

export default router;