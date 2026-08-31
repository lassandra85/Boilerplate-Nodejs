import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

import { z } from "zod";

extendZodWithOpenApi(z);

import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "./validators/auth.validator.ts";

import {
  announcementIdSchema,
  announcementQuerySchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "./validators/announcements.validator.ts";

export const registry = new OpenAPIRegistry();


// ============================================
// SECURITY
// ============================================

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});


// ============================================
// AUTH
// ============================================

registry.registerPath({
  method: "post",
  path: "/auth/register",

  request: {
    body: {
      content: {
        "application/json": {
          schema: registerSchema,
        },
      },
    },
  },

  responses: {
    201: {
      description: "User successfully registered",
    },
    400: {
      description: "Validation failed",
    },
    409: {
      description: "Username or email already taken",
    },
  },
});


registry.registerPath({
  method: "post",
  path: "/auth/login",

  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Login successful",
    },
    400: {
      description: "Validation failed",
    },
    401: {
      description: "Invalid credentials",
    },
  },
});


registry.registerPath({
  method: "post",
  path: "/auth/refresh",

  request: {
    body: {
      content: {
        "application/json": {
          schema: refreshSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Tokens refreshed",
    },
    400: {
      description: "Validation failed",
    },
    401: {
      description: "Invalid refresh token",
    },
  },
});


registry.registerPath({
  method: "post",
  path: "/auth/logout",

  security: [
    {
      bearerAuth: [],
    },
  ],

  responses: {
    204: {
      description: "Successfully logged out",
    },
    401: {
      description: "Authentication required",
    },
  },
});


registry.registerPath({
  method: "get",
  path: "/auth/me",

  security: [
    {
      bearerAuth: [],
    },
  ],

  responses: {
    200: {
      description: "Current user profile",
    },
    401: {
      description: "Authentication required",
    },
  },
});


// ============================================
// ANNOUNCEMENTS
// ============================================

registry.registerPath({
  method: "get",
  path: "/announcements",

  request: {
    query: announcementQuerySchema,
  },

  responses: {
    200: {
      description: "List of announcements",
    },
    400: {
      description: "Validation failed",
    },
  },
});


registry.registerPath({
  method: "get",
  path: "/announcements/{id}",

  request: {
    params: announcementIdSchema,
  },

  responses: {
    200: {
      description: "Announcement details",
    },
    400: {
      description: "Validation failed",
    },
    404: {
      description: "Announcement not found",
    },
  },
});


registry.registerPath({
  method: "post",
  path: "/announcements",

  security: [
    {
      bearerAuth: [],
    },
  ],

  request: {
    body: {
      content: {
        "application/json": {
          schema: createAnnouncementSchema,
        },
      },
    },
  },

  responses: {
    201: {
      description: "Announcement created",
    },
    400: {
      description: "Validation failed",
    },
    401: {
      description: "Authentication required",
    },
  },
});


registry.registerPath({
  method: "patch",
  path: "/announcements/{id}",

  security: [
    {
      bearerAuth: [],
    },
  ],

  request: {
    params: announcementIdSchema,

    body: {
      content: {
        "application/json": {
          schema: updateAnnouncementSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Announcement updated",
    },
    400: {
      description: "Validation failed",
    },
    401: {
      description: "Authentication required",
    },
    403: {
      description: "Access denied",
    },
    404: {
      description: "Announcement not found",
    },
  },
});


registry.registerPath({
  method: "delete",
  path: "/announcements/{id}",

  security: [
    {
      bearerAuth: [],
    },
  ],

  request: {
    params: announcementIdSchema,
  },

  responses: {
    204: {
      description: "Announcement deleted",
    },
    400: {
      description: "Validation failed",
    },
    401: {
      description: "Authentication required",
    },
    403: {
      description: "Access denied",
    },
    404: {
      description: "Announcement not found",
    },
  },
});


// ============================================
// DOCUMENT
// ============================================

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(
    registry.definitions,
  );

  return generator.generateDocument({
    openapi: "3.0.0",

    info: {
      title: "Announcements REST API",
      version: "1.0.0",
      description:
        "REST API for an announcements board with JWT authentication",
    },

    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  });
}
