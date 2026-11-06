import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import {
  verifyAdminToken,
  verifyCustomerToken,
  AdminAuthNotConfiguredError
} from "../services/adminAuth";

/**
 * Gate for administrative endpoints.
 *
 * Every route behind this can move money, expose customer data, or reconfigure
 * the store. Before this existed the entire admin surface was reachable by
 * anyone who knew a URL — refunds, database repointing, backup restore and the
 * provider secrets among them.
 *
 * The token arrives as `Authorization: Bearer <token>`, minted by
 * POST /api/customers/admin-login. A header is used rather than a cookie because
 * the frontend sends no credentials today and nothing sets `credentials:'include'`,
 * so a cookie scheme would need every call site changed before any of them worked.
 */

export interface AdminRequest extends Request {
  admin?: { email: string };
  /** Set by requireCustomer. The ONLY trustworthy statement of who is calling. */
  customer?: { email: string };
}

function bearer(req: Request): string {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

/**
 * Gate for a shopper acting on their own data.
 *
 * Identity comes from a signed token and nothing else. Routes used to take the
 * customer's email from the request body or an `x-user-email` header and trust
 * it, which meant anyone could read or change anyone's account by typing a
 * different address.
 *
 * An admin token is accepted too, so support staff can act on a customer's
 * behalf; `req.customer` is then the email named in the request rather than the
 * admin's own, and `req.admin` records who actually did it.
 */
export function requireCustomer(req: AdminRequest, res: Response, next: NextFunction) {
  const token = bearer(req);

  let customer: ReturnType<typeof verifyCustomerToken>;
  let admin: ReturnType<typeof verifyAdminToken>;
  try {
    customer = verifyCustomerToken(token);
    admin = customer ? null : verifyAdminToken(token);
  } catch (err) {
    if (err instanceof AdminAuthNotConfiguredError) {
      console.error("[Customer Auth] Refusing request:", err.message);
      return res.status(503).json({
        error: "Authentication is not configured on this server.",
        code: "AUTH_NOT_CONFIGURED"
      });
    }
    throw err;
  }

  if (customer) {
    req.customer = { email: customer.sub };
    return next();
  }

  if (admin) {
    req.admin = { email: admin.sub };
    // Left unset deliberately: an admin has no single customer identity, so the
    // handler must decide which account it is acting on and say so explicitly.
    return next();
  }

  return res.status(401).json({
    error: "You must be signed in to do this.",
    code: "CUSTOMER_AUTH_REQUIRED"
  });
}

/**
 * Confirms the caller may act on `email`.
 *
 * Returns true for that customer themselves, and for any admin. Handlers call
 * this rather than comparing an email from the body, which proves nothing.
 */
export function mayActOnCustomer(req: AdminRequest, email: string | undefined | null): boolean {
  if (req.admin) return true;
  const target = String(email || "").trim().toLowerCase();
  if (!target) return false;
  return req.customer?.email === target;
}

export function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const token = bearer(req);

  let payload: ReturnType<typeof verifyAdminToken>;
  try {
    payload = verifyAdminToken(token);
  } catch (err) {
    if (err instanceof AdminAuthNotConfiguredError) {
      // A deployment fault, not a rejected visitor. Said plainly so it is not
      // mistaken for a wrong password, and still refused — an unconfigured
      // secret must never mean "let everyone through".
      console.error("[Admin Auth] Refusing admin request:", err.message);
      return res.status(503).json({
        error: "Admin authentication is not configured on this server.",
        code: "ADMIN_AUTH_NOT_CONFIGURED"
      });
    }
    throw err;
  }

  if (!payload) {
    return res.status(401).json({
      error: "Administrator authentication required.",
      code: "ADMIN_AUTH_REQUIRED"
    });
  }

  req.admin = { email: payload.sub };
  next();
}

/**
 * Gate for scheduled jobs.
 *
 * The Vercel crons charge cards, reconcile payments and sync Royal Mail, and
 * were reachable by anyone over GET. Vercel sends `Authorization: Bearer
 * $CRON_SECRET` when CRON_SECRET is set in the project, so the same header
 * serves both; an admin token is also accepted so these can still be run by hand
 * from the dashboard.
 *
 * If CRON_SECRET is unset the job is refused rather than run, so a forgotten
 * environment variable fails visibly instead of leaving the endpoint open.
 */
export function requireCronOrAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const presented = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const cronSecret = process.env.CRON_SECRET || "";

  if (cronSecret && presented) {
    const a = Buffer.from(presented);
    const b = Buffer.from(cronSecret);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next();
  }

  // Fall back to an admin token so the same endpoints stay usable from the
  // dashboard's manual "run now" controls.
  try {
    if (verifyAdminToken(presented)) return next();
  } catch (err) {
    if (!(err instanceof AdminAuthNotConfiguredError)) throw err;
  }

  if (!cronSecret) {
    console.error("[Cron Auth] CRON_SECRET is not set — refusing scheduled job request.");
    return res.status(503).json({
      error: "Scheduled job authentication is not configured on this server.",
      code: "CRON_SECRET_NOT_CONFIGURED"
    });
  }

  return res.status(401).json({
    error: "Scheduled job authentication required.",
    code: "CRON_AUTH_REQUIRED"
  });
}
