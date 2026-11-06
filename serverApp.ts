import express from "express";
import path from "path";
import fs from "fs";
import { 
  fetchResource, saveResource, saveUploadedImage, getUploadedImage, 
  getConnectionStatus, updateDatabaseUrl, getDb, getDatabaseDetails, 
  fetchLayoutSettings, saveLayoutSettings, fetchDevSettings, saveDevSettings,
  createDatabaseBackup, listDatabaseBackups, restoreDatabaseBackup
} from "./serverDb";

// Import modular routers for products, collections, customers, orders, files, discounts, custom pages, and blogs
import productsRouter from "./backend/routes/products";
import collectionsRouter from "./backend/routes/collections";
import ordersRouter from "./backend/routes/orders";
import recycleBinRouter from "./backend/routes/recycleBin";
import analyticsRouter from "./backend/routes/analytics";
import siteStatusRouter from "./backend/routes/siteStatus";
import filesRouter from "./backend/routes/files";
import customersRouter from "./backend/routes/customers";
import discountsRouter from "./backend/routes/discounts";
import customPagesRouter from "./backend/routes/customPages";
import blogsRouter from "./backend/routes/blogs";
import worldpayRouter from "./backend/routes/worldpay";
import subscriptionsRouter from "./backend/routes/subscriptions";
import structureRouter from "./backend/routes/structure";
import emailRouter from "./backend/routes/email";
import klaviyoRouter from "./backend/routes/klaviyo";
import royalMailRouter from "./backend/routes/royalMail";
import contactMessagesRouter from "./backend/routes/contactMessages";
import agecheckedRouter, { handleCallback as handleAgeCheckedCallback } from "./backend/routes/agechecked";
import authRouter, { handleGoogleOAuthCallback } from "./backend/routes/auth";
import integrationsRouter from "./backend/routes/integrations";

import mediaRouter from "./backend/routes/media";
import { uploadToCloudinary, isCloudinaryConfigured } from "./backend/services/cloudinary";
import { prisma } from "./src/lib/prisma";
import { requireAdmin } from "./backend/middleware/requireAdmin";

export async function createExpressApp() {
  const app = express();

  // Trust reverse proxy for correct proto and host detection in Cloud Run
  app.set('trust proxy', true);

  // Hydrate environment variables (including Cloudinary) from stored layout settings
  try {
    await Promise.race([
      Promise.all([fetchLayoutSettings(), fetchDevSettings()]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database settings hydration timed out')), 8000))
    ]);
  } catch (err) {}

  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return next();
    }
    express.json({
      limit: "1000mb",
      // Worldpay posts its webhooks under versioned vendor media types such as
      // application/vnd.worldpay.webhooks-v1.hal+json, not application/json.
      // express.json() matches only application/json by default, so it skipped
      // those bodies and left req.body as {} — the handler logged 15 receipts
      // with a null eventType and an empty rawBody, which is indistinguishable
      // from Worldpay sending nothing. Any +json structured-syntax suffix is
      // parsed here for that reason.
      type: ['application/json', 'application/*+json'],
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      }
    })(req, res, next);
  });

  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return next();
    }
    express.urlencoded({ limit: "1000mb", extended: true })(req, res, next);
  });

  let uploadsPath = path.join(process.cwd(), "uploads");
  try {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      uploadsPath = "/tmp/uploads";
    }
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
  } catch (err) {
    console.warn("[Uploads Setup] Failed to create uploads directory at", uploadsPath, err);
    uploadsPath = "/tmp/uploads";
    try {
      if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
      }
    } catch (tmpErr) {
      console.error("[Uploads Setup] Fatal: failed to create /tmp/uploads:", tmpErr);
    }
  }

  const serveMediaBuffer = (req: express.Request, res: express.Response, buffer: Buffer, mimeType: string) => {
    const range = req.headers.range;
    const fileSize = buffer.length;

    if (range && (mimeType.startsWith("video/") || mimeType.startsWith("audio/"))) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
        return res.end();
      }

      const chunksize = (end - start) + 1;
      const chunk = buffer.subarray(start, end + 1);

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000",
      });
      return res.end(chunk);
    } else {
      res.writeHead(200, {
        "Content-Type": mimeType,
        "Content-Length": fileSize,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000",
      });
      return res.end(buffer);
    }
  };

  const handleUploadsFileRequest = async (req: express.Request, res: express.Response) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(uploadsPath, filename);
      
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      
      const dotIndex = filename.lastIndexOf(".");
      const id = dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;
      
      const imgDoc = await getUploadedImage(filename) || await getUploadedImage(id);
      if (imgDoc && imgDoc.base64Data) {
        try {
          fs.writeFileSync(filePath, Buffer.from(imgDoc.base64Data, "base64"));
          return res.sendFile(filePath);
        } catch (e) {}
        const imgBuffer = Buffer.from(imgDoc.base64Data, "base64");
        return serveMediaBuffer(req, res, imgBuffer, imgDoc.mimeType || "image/png");
      }
    } catch (err) {
      console.error("[Uploads] Error reading uploaded file:", err);
    }
    return res.status(404).send("File not found");
  };

  app.get("/uploads/:filename", handleUploadsFileRequest);
  app.get("/api/uploads/:filename", handleUploadsFileRequest);

  app.use("/uploads", express.static(uploadsPath));
  app.use("/api/uploads", express.static(uploadsPath));

  app.post("/api/upload", requireAdmin, async (req, res) => {
    try {
      const { data, filename, cloudName, apiKey, apiSecret, cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } = req.body;
      if (!data) {
        return res.status(400).json({ error: "Missing data payload for upload." });
      }

      // Check if Cloudinary credentials were explicitly supplied in request body
      const passedCloudName = cloudName || cloudinaryCloudName;
      const passedApiKey = apiKey || cloudinaryApiKey;
      const passedApiSecret = apiSecret || cloudinaryApiSecret;

      if (passedCloudName) process.env.CLOUDINARY_CLOUD_NAME = String(passedCloudName).trim();
      if (passedApiKey) process.env.CLOUDINARY_API_KEY = String(passedApiKey).trim();
      if (passedApiSecret) process.env.CLOUDINARY_API_SECRET = String(passedApiSecret).trim();

      if (!isCloudinaryConfigured()) {
        try {
          await fetchLayoutSettings();
        } catch (e) {}
      }

      let base64String = data;
      let mimeType = "image/png";

      if (typeof data === "string" && data.startsWith("data:")) {
        const matches = data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64String = matches[2];
        }
      }

      if (typeof base64String === "string" && base64String.includes(";base64,")) {
        base64String = base64String.split(";base64,").pop() || base64String;
      }
      base64String = (base64String || "").trim();

      const displayName = filename || `upload-${Date.now()}`;
      const isVideo = mimeType.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogg|avi|mkv)$/i.test(displayName);

      // 1. If Cloudinary is configured, upload directly to Cloudinary
      if (isCloudinaryConfigured()) {
        try {
          const fileBuffer = Buffer.from(base64String, "base64");
          const uploadResult = await uploadToCloudinary(fileBuffer, {
            folder: 'storefront_media',
            originalFilename: displayName,
            resourceType: isVideo ? 'video' : 'auto'
          });

          const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const displaySize = uploadResult.fileSize > 1024 * 1024
            ? `${(uploadResult.fileSize / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(uploadResult.fileSize / 1024)} KB`;

          let newFile: any = null;
          const entryResourceType = uploadResult.resourceType || (isVideo ? 'video' : 'image');
          const entryMimeType = mimeType || (isVideo ? 'video/mp4' : 'image/png');

          try {
            newFile = await prisma.fileEntry.create({
              data: {
                id,
                publicId: uploadResult.publicId,
                url: uploadResult.secureUrl || uploadResult.url,
                secureUrl: uploadResult.secureUrl,
                resourceType: entryResourceType,
                format: uploadResult.format,
                width: uploadResult.width || null,
                height: uploadResult.height || null,
                fileSize: displaySize,
                size: displaySize,
                folder: uploadResult.folder,
                originalFilename: displayName,
                fileName: displayName,
                altText: displayName.split('.')[0] || 'Uploaded Asset',
                dateAdded: new Date().toISOString().split('T')[0],
                references: 'Direct Upload',
                mimeType: entryMimeType
              }
            });
          } catch (dbErr) {
            newFile = {
              id,
              publicId: uploadResult.publicId,
              url: uploadResult.secureUrl || uploadResult.url,
              secureUrl: uploadResult.secureUrl,
              fileName: displayName,
              altText: displayName.split('.')[0] || 'Uploaded Asset',
              dateAdded: new Date().toISOString().split('T')[0],
              mimeType: entryMimeType,
              resourceType: entryResourceType,
              size: displaySize,
              fileSize: displaySize,
              references: 'Direct Upload'
            };
          }

          try {
            const currentFiles = await fetchResource('files');
            const currentArr = Array.isArray(currentFiles) ? currentFiles : [];
            const updatedFiles = [newFile, ...currentArr.filter((f: any) => f && f.url !== newFile.url)];
            await saveResource('files', updatedFiles);
          } catch (sErr) {}

          return res.json({
            url: newFile.url,
            secureUrl: newFile.secureUrl,
            publicId: newFile.publicId,
            id: newFile.id,
            fileName: displayName,
            mimeType: entryMimeType,
            resourceType: entryResourceType
          });
        } catch (cErr: any) {
          console.warn("[API Upload] Cloudinary upload failed, falling back to disk:", cErr?.message || cErr);
        }
      }

      // 2. Fallback if Cloudinary environment variables are missing
      const id = `file-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      let extension = "png";
      if (filename && filename.includes(".")) {
        extension = filename.split(".").pop()?.toLowerCase() || "png";
      } else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        extension = "jpg";
      } else if (mimeType.includes("mp4")) {
        extension = "mp4";
      }

      const filenameOnDisk = `${id}.${extension}`;
      const filePath = path.join(uploadsPath, filenameOnDisk);
      try {
        fs.writeFileSync(filePath, Buffer.from(base64String, "base64"));
      } catch (fsErr) {
        console.error("[API Upload] Failed to write file to local disk:", fsErr);
      }

      await saveUploadedImage(id, base64String, mimeType);
      
      const fileUrl = `/api/uploads/${filenameOnDisk}`;
      const rawBytes = Math.round(base64String.length * 0.75);
      const calculatedSize = rawBytes > 1024 * 1024 
        ? `${(rawBytes / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(rawBytes / 1024)} KB`;

      const isVid = mimeType.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogg|avi|mkv)$/i.test(filename || "");
      const diskEntry = {
        id,
        fileName: displayName,
        url: fileUrl,
        altText: displayName.split('.')[0] || 'Uploaded Media Asset',
        mimeType: mimeType || (isVid ? 'video/mp4' : 'image/png'),
        resourceType: isVid ? 'video' : 'image',
        size: calculatedSize,
        fileSize: calculatedSize,
        references: 'Direct Upload',
        dateAdded: new Date().toISOString().split('T')[0]
      };

      try {
        await prisma.fileEntry.create({
          data: diskEntry
        });
      } catch (fileRegErr) {}

      try {
        const currentFiles = await fetchResource('files');
        const currentArr = Array.isArray(currentFiles) ? currentFiles : [];
        const updatedFiles = [diskEntry, ...currentArr.filter((f: any) => f && f.url !== diskEntry.url)];
        await saveResource('files', updatedFiles);
      } catch (sErr) {}

      res.json({ url: fileUrl, id, fileName: displayName, mimeType: diskEntry.mimeType, resourceType: diskEntry.resourceType });
    } catch (err: any) {
      console.error("[API Upload] Fail:", err);
      res.status(500).json({ error: err.message || "Failed to process image upload" });
    }
  });

  app.get("/api/images/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const imgDoc = await getUploadedImage(id);
      if (!imgDoc) {
        return res.status(404).send("Media asset not found");
      }

      const imgBuffer = Buffer.from(imgDoc.base64Data, "base64");
      return serveMediaBuffer(req, res, imgBuffer, imgDoc.mimeType || "image/png");
    } catch (err: any) {
      res.status(500).send("Internal server error serving media");
    }
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Comprehensive DB diagnostic status endpoint
  app.get("/api/status", requireAdmin, async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const status = await getConnectionStatus();
      if (status.status === 'connected') {
        res.status(200).json({
          statusCode: 200,
          status: 'connected',
          databaseUrlConfigured: true,
          provider: 'Neon PostgreSQL',
          host: status.host || 'Connected',
          database: status.database || 'neondb',
          error: null,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(200).json({
          statusCode: 500,
          status: status.status || 'error',
          databaseUrlConfigured: !!process.env.DATABASE_URL,
          provider: 'Neon PostgreSQL',
          host: status.host || 'N/A',
          database: status.database || 'N/A',
          error: status.error || 'Database connection test failed.',
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      res.status(200).json({
        statusCode: 500,
        status: 'error',
        databaseUrlConfigured: !!process.env.DATABASE_URL,
        provider: 'Neon PostgreSQL',
        host: 'N/A',
        database: 'N/A',
        error: err?.message || String(err),
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/db-status", requireAdmin, async (req, res) => {
    try {
      await getDb();
    } catch (e) {}
    res.json(await getConnectionStatus());
  });

  app.get("/api/db-details", requireAdmin, async (req, res) => {
    try {
      const details = await getDatabaseDetails();
      res.json(details);
    } catch (err: any) {
      console.error("[API db-details] Error fetching DB details:", err);
      res.status(500).json({ error: err.message || "Failed to fetch database details" });
    }
  });

  app.post("/api/update-db-uri", requireAdmin, async (req: any, res) => {
    try {
      const { uri, confirmPassword } = req.body || {};
      // Repointing the database from a dashboard field is how a store locks
      // itself out of its own data, so it is off unless the operator opts in
      // in the environment, and it needs the admin password re-entered.
      if (process.env.ALLOW_RUNTIME_DB_SWITCH !== "true" || process.env.VERCEL) {
        return res.status(403).json({
          error:
            "Switching the database from the dashboard is disabled. Use Settings → Integrations → Neon to validate a new connection string, then update DATABASE_URL in your hosting environment and redeploy."
        });
      }
      const { verifyAdminCredentials } = await import("./backend/services/adminAuth");
      if (!confirmPassword || !verifyAdminCredentials(req.admin?.email || "", String(confirmPassword))) {
        return res.status(403).json({ error: "Re-enter your admin password to change the database connection." });
      }
      const { validatePostgresUrl } = await import("./backend/routes/integrations");
      const parsed = validatePostgresUrl(uri);
      if (!parsed.ok) return res.status(400).json({ error: parsed.error });

      // Prove the candidate works and holds this store's schema BEFORE switching.
      const { PrismaClient } = await import("@prisma/client");
      const candidate = new PrismaClient({ datasources: { db: { url: parsed.url } } });
      try {
        const rows: any[] = await candidate.$queryRawUnsafe(
          `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('StoreResource','Order','Product','Customer')`
        );
        if (rows.length < 4) {
          return res.status(400).json({ error: "That database does not contain this store's tables. Not switching." });
        }
      } catch (e: any) {
        return res.status(400).json({ error: `Could not connect to that database: ${String(e?.message || e).slice(0, 200)}` });
      } finally {
        await candidate.$disconnect().catch(() => {});
      }
      const updatedStatus = await updateDatabaseUrl(parsed.url);
      res.json(updatedStatus);
    } catch (err: any) {
      console.error("[API update-db-uri] Error updating connection string:", err);
      res.status(500).json({ error: err.message || "Failed to update connection string" });
    }
  });

  // Automated Neon PostgreSQL Backups
  app.post("/api/backup", requireAdmin, async (req, res) => {
    try {
      const name = req.body?.name || `Manual Backup ${new Date().toLocaleDateString()}`;
      const snapshot = await createDatabaseBackup(name);
      res.json({ success: true, backup: snapshot });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to create database backup' });
    }
  });

  app.get("/api/backup", requireAdmin, async (req, res) => {
    try {
      const list = await listDatabaseBackups();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to list database backups' });
    }
  });

  app.post("/api/backup/restore", requireAdmin, async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Backup ID is required' });
      const success = await restoreDatabaseBackup(id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to restore database backup' });
    }
  });

  // Full Database Diagnostics across all tables
  app.get("/api/db-diagnostics", requireAdmin, async (req, res) => {
    try {
      const isConnected = await getDb();
      if (!isConnected) {
        return res.json({ connected: false, error: "Database not connected" });
      }
      const [
        pagesCount,
        productsCount,
        collectionsCount,
        ordersCount,
        customersCount,
        blogsCount,
        discountsCount,
        filesCount,
        resourcesCount
      ] = await Promise.all([
        prisma.customPage.count().catch(() => 0),
        prisma.product.count().catch(() => 0),
        prisma.collection.count().catch(() => 0),
        prisma.order.count().catch(() => 0),
        prisma.customer.count().catch(() => 0),
        prisma.blogPost.count().catch(() => 0),
        prisma.discount.count().catch(() => 0),
        prisma.fileEntry.count().catch(() => 0),
        prisma.storeResource.count().catch(() => 0)
      ]);

      res.json({
        connected: true,
        counts: {
          customPages: pagesCount,
          products: productsCount,
          collections: collectionsCount,
          orders: ordersCount,
          customers: customersCount,
          blogs: blogsCount,
          discounts: discountsCount,
          files: filesCount,
          storeResources: resourcesCount
        }
      });
    } catch (err: any) {
      res.status(500).json({ connected: false, error: err?.message });
    }
  });

  // Cloudinary configuration & diagnostic check
  const handleTestCloudinary = async (req: express.Request, res: express.Response) => {
    try {
      let cloudName = req.body?.cloudName || process.env.CLOUDINARY_CLOUD_NAME;
      let apiKey = req.body?.apiKey || process.env.CLOUDINARY_API_KEY;
      let apiSecret = req.body?.apiSecret || process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        try {
          const layout = await fetchLayoutSettings();
          if (layout) {
            cloudName = cloudName || layout.cloudinaryCloudName;
            apiKey = apiKey || layout.cloudinaryApiKey;
            apiSecret = apiSecret || layout.cloudinaryApiSecret;
          }
        } catch (e) {}
      }

      const hasCloudName = Boolean(cloudName && String(cloudName).trim().length > 0);
      const hasApiKey = Boolean(apiKey && String(apiKey).trim().length > 0);
      const hasApiSecret = Boolean(apiSecret && String(apiSecret).trim().length > 0);
      const isConfigured = hasCloudName && hasApiKey && hasApiSecret;

      if (isConfigured) {
        process.env.CLOUDINARY_CLOUD_NAME = cloudName;
        process.env.CLOUDINARY_API_KEY = apiKey;
        process.env.CLOUDINARY_API_SECRET = apiSecret;
      }

      res.json({
        success: isConfigured,
        configured: isConfigured,
        hasCloudName,
        hasApiKey,
        hasApiSecret,
        cloudName: cloudName ? String(cloudName).trim() : null,
        apiKeyMasked: apiKey ? `${String(apiKey).substring(0, 4)}***` : null,
        message: isConfigured 
          ? 'Cloudinary credentials are fully valid and configured.'
          : 'Cloudinary environment variables missing or incomplete.'
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        configured: false,
        error: err?.message || 'Error testing Cloudinary configuration'
      });
    }
  };

  // Accepts Cloudinary credentials in the body and writes them into process.env,
  // so an anonymous caller could repoint the store's media account.
  app.get("/api/test-cloudinary", requireAdmin, handleTestCloudinary);
  app.post("/api/test-cloudinary", requireAdmin, handleTestCloudinary);

  app.get("/api/layoutsettings", async (req, res) => {
    try {
      const data = await fetchLayoutSettings();
      // Public endpoint (the storefront header/footer read it), but the same
      // record holds the Cloudinary API secret. Only an admin gets secrets back.
      let isAdmin = false;
      try {
        const { verifyAdminToken } = await import("./backend/services/adminAuth");
        const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
        isAdmin = Boolean(token && verifyAdminToken(token));
      } catch (_e) {}
      if (!isAdmin && data && typeof data === "object") {
        const SECRET_KEY = /(secret|apikey|api_key|password|privatekey|token)$/i;
        const publicCopy: Record<string, any> = {};
        for (const [k, v] of Object.entries(data)) {
          if (k === "klaviyoPublicKey" || !SECRET_KEY.test(k)) publicCopy[k] = v;
        }
        return res.json(publicCopy);
      }
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load layout settings" });
    }
  });

  app.post("/api/layoutsettings", requireAdmin, async (req, res) => {
    try {
      const saved = await saveLayoutSettings(req.body);
      res.json({ status: "success", data: saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save layout settings" });
    }
  });

  app.get("/api/devsettings", async (req, res) => {
    try {
      const data = await fetchDevSettings();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load dev settings" });
    }
  });

  app.post("/api/devsettings", requireAdmin, async (req, res) => {
    try {
      const saved = await saveDevSettings(req.body);
      res.json({ status: "success", data: saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save dev settings" });
    }
  });

  // Kept so older storefront builds do not 404, but it no longer sends anything.
  // It used to email whatever order body it was given to whatever address that
  // body named — an open relay on the store's sender identity — and it duplicated
  // the confirmation that saveSingleOrder() already sends (once, de-duplicated)
  // when the server records the order.
  app.post("/api/send-order-confirmation", (req, res) => {
    res.json({
      success: true,
      handledByServer: true,
      message: "Order confirmations are sent by the server when the order is recorded.",
      timestamp: new Date().toISOString()
    });
  });

  // Mount modular backend routers
  app.use("/api/media", requireAdmin, mediaRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/collections", collectionsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/recycle-bin", recycleBinRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/site-status", siteStatusRouter);
  app.use("/api/files", filesRouter);
  app.use("/api/customers", customersRouter);
  app.use("/api/discounts", discountsRouter);
  app.use("/api/custompages", customPagesRouter);
  app.use("/api/blogs", blogsRouter);
  app.use("/api/worldpay/subscriptions", subscriptionsRouter);
  app.use("/api/subscriptions", subscriptionsRouter);
  app.use("/api/worldpay", worldpayRouter);
  app.use("/api/folder-structure", requireAdmin, structureRouter);
  app.use("/api/email", emailRouter);
  app.use("/api/klaviyo", klaviyoRouter);
  app.use("/api/royalmail", royalMailRouter);
  app.use("/api/royal-mail", royalMailRouter);
  // Support exact AgeChecked callback endpoints (/api/agechecked, /api/agechecked/callback)
  app.all(["/api/agechecked", "/api/agechecked/", "/api/agechecked/callback", "/api/agechecked/callback/"], (req, res, next) => {
    // If it's a subroute like /api/agechecked/init, let agecheckedRouter handle it
    if (req.path === "/api/agechecked" || req.path === "/api/agechecked/" || req.path === "/api/agechecked/callback" || req.path === "/api/agechecked/callback/") {
      return handleAgeCheckedCallback(req, res);
    }
    next();
  });
  app.use("/api/agechecked", agecheckedRouter);
  app.post("/api/create-order", (req, res, next) => {
    req.url = "/create-order";
    return royalMailRouter(req, res, next);
  });
  app.use("/api/integrations", integrationsRouter);
  app.use("/api/contact-messages", contactMessagesRouter);
  app.use("/api/auth", authRouter);
  app.get(["/auth/google/callback", "/auth/google/callback/"], handleGoogleOAuthCallback);

  // Fallback 404 handler for unhandled /api endpoints (ensures JSON response instead of HTML)
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "API endpoint not found",
      message: `No route found for ${req.method} ${req.originalUrl}`
    });
  });

  // Global error handling middleware for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Express Error Handler]", err);
    if (req.originalUrl.startsWith("/api") || req.url.startsWith("/api")) {
      return res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal Server Error",
        message: err.message || "An unexpected server error occurred"
      });
    }
    next(err);
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      const lastSegment = url.split('/').pop() || '';
      if (url.startsWith("/api") || lastSegment.includes(".")) {
        return next();
      }
      try {
        const fs = await import("fs");
        let html = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        html = await vite.transformIndexHtml(url, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      const url = req.originalUrl;
      const lastSegment = url.split('/').pop() || '';
      if (url.startsWith("/api") || lastSegment.includes(".")) {
        return res.status(404).send("API or File Asset Not Found");
      }
      
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          res.status(500).send("Internal Server Error: Missing compiled static resources.");
        }
      });
    });
  }

  // Initialize background subscription recurring renewal worker
  try {
    const { startSubscriptionRenewalWorker } = await import("./backend/services/subscriptionCron");
    startSubscriptionRenewalWorker(5 * 60 * 1000);
  } catch (workerErr) {
    console.warn("[Subscription Cron] Failed to initialize subscription worker:", workerErr);
  }

  return app;
}
