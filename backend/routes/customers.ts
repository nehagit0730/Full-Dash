import { Router } from "express";
import crypto from "crypto";
import { fetchResource, saveResource, getDb } from "../../serverDb";
import { Customer } from "../../src/types";
import { prisma } from "../../src/lib/prisma";
import { sendWelcomeEmail, sendPasswordResetEmail, sendEmailVerificationEmail, sendLoginNotificationEmail } from "../services/emailService";
import { trackCustomerSignup, trackEmailVerified } from "../services/klaviyoService";
import { verifyRecaptchaToken } from "../services/recaptchaService";
import {
  signAdminToken,
  signCustomerToken,
  verifyAdminCredentials,
  AdminAuthNotConfiguredError
} from "../services/adminAuth";
import { requireAdmin, requireCustomer, mayActOnCustomer, AdminRequest } from "../middleware/requireAdmin";

const router = Router();

// Password hashing helper using standard Node crypto
function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "pouch_supply_salt_123!")
    .digest("hex");
}

// Helper to enrich customer object with persistent age verification status
async function enrichCustomerAgeStatus(customer: any) {
  if (!customer || !customer.email) return customer;
  const emailTrim = customer.email.trim().toLowerCase();

  try {
    const ageResource = await prisma.storeResource.findUnique({
      where: {
        resource_itemId: {
          resource: "age_verification",
          itemId: emailTrim
        }
      }
    });

    if (ageResource && ageResource.data) {
      const data = ageResource.data as any;
      if (data.approved === true || data.verified === true) {
        return {
          ...customer,
          ageVerified: true,
          ageChecked: true,
          ageCheckId: data.agecheckid || customer.ageCheckId,
          ageVerifiedAt: data.verifiedAt || customer.ageVerifiedAt
        };
      }
    }
  } catch (_e) {}

  return customer;
}

// GET all customers (Admin use)
// Returned every customer's name, email, address history and spend to anyone
// who asked. Stripping passwordHash was never the point — the rest is the PII.
router.get("/", requireAdmin, async (req, res) => {
  try {
    const data = await fetchResource("customers");
    // Remove password hashes from output for security
    const sanitized = data.map(({ passwordHash, ...rest }) => rest);
    res.json(sanitized);
  } catch (err: any) {
    console.error("[Customers Router] GET Error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch customers" });
  }
});

// GET customer by email — the shopper's own record, or any record for an admin.
// This was an open lookup: anyone could read any account by guessing an email.
router.get("/by-email", requireCustomer, async (req: AdminRequest, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: "Email query parameter is required." });
    }

    if (!mayActOnCustomer(req, email)) {
      // 404 rather than 403: a 403 would confirm the address has an account here,
      // which is exactly what an address-guessing attempt is trying to learn.
      return res.status(404).json({ error: "Customer not found." });
    }

    const customersList = await fetchResource("customers");
    const found: any = customersList.find((c: any) => c.email.toLowerCase() === email);

    if (!found) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const { passwordHash, ...safeCustomer } = found;
    const enriched = await enrichCustomerAgeStatus(safeCustomer);
    res.json({ customer: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch customer" });
  }
});

// POST update/sync customers (Admin use) — replaces the whole customer list.
router.post("/", requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: "Customers API expects an array of documents" });
    }

    const database = await getDb();
    if (!database) {
      res.setHeader("X-Database-Offline", "true");
    } else {
      res.setHeader("X-Database-Offline", "false");
    }

    const updated = await saveResource("customers", payload);
    res.json(updated);
  } catch (err: any) {
    console.error("[Customers Router] POST Error:", err);
    res.status(500).json({ error: err.message || "Failed to persist customers" });
  }
});

// POST: Customer Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, location = "United Kingdom", referredByCode = null, recaptchaToken, token } = req.body;

    // Verify Google reCAPTCHA v3
    const captchaCheck = await verifyRecaptchaToken(recaptchaToken || token, 'customer_signup');
    if (!captchaCheck.success) {
      return res.status(403).json({ error: captchaCheck.error || 'reCAPTCHA verification failed. Please try again.' });
    }

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "Name, email, mobile phone number, and password are required for registration." });
    }

    const emailTrim = email.trim().toLowerCase();
    const customersList = await fetchResource("customers");
    
    const existing = customersList.find((c: any) => c.email.toLowerCase() === emailTrim);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // Generate unique referral code for the new customer
    const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleanFirstName = name.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase() || "USER";
    const referralCode = `REF-PS-${cleanFirstName}-${codeSuffix}`;

    // Verify referrer
    let validReferredByCode: string | null = null;
    if (referredByCode) {
      const trimmedCode = referredByCode.trim().toUpperCase();
      const referrer = customersList.find((c: any) => c.referralCode && c.referralCode.toUpperCase() === trimmedCode);
      if (referrer) {
        validReferredByCode = referrer.referralCode;
      }
    }

    const newCustomer: Customer & { passwordHash: string } = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      email: emailTrim,
      phone: phone.trim(),
      subscriptionStatus: "Not subscribed",
      location: location.trim(),
      ordersCount: 0,
      amountSpent: 0,
      addresses: [], // Start with empty addresses array, no mock placeholder
      wishlist: [],
      referralCode,
      storeCredit: 0,
      referredByCode: validReferredByCode,
      passwordHash: hashPassword(password),
    };

    const updatedList = [...customersList, newCustomer];
    await saveResource("customers", updatedList);

    // If successfully registered and has referredByCode, create their 10% coupon
    if (validReferredByCode) {
      try {
        const discountCode = `REF10-${codeSuffix}`;
        const discountsList = await fetchResource("discounts") || [];
        const newDiscount = {
          id: `disc-ref-${newCustomer.id}`,
          title: discountCode,
          status: 'Active',
          method: 'Code',
          eligibility: 'All customers',
          type: 'Amount off order',
          used: 0,
          details: `10% discount welcome coupon for referred customer`,
          valueType: 'Percentage',
          valueAmount: 10,
          limitOnePerCustomer: true
        };
        await saveResource("discounts", [...discountsList, newDiscount]);
        console.log(`[Referral System] Generated 10% discount coupon ${discountCode} for referred customer: ${emailTrim}`);
      } catch (err) {
        console.error("Failed to generate referral discount:", err);
      }
    }

    console.log(`[Customer Auth] New registration successful for: ${emailTrim}`);
    
    // Automatically dispatch Welcome Email and Klaviyo Event
    sendWelcomeEmail(emailTrim, name.trim(), validReferredByCode ? `REF10-${codeSuffix}` : 'WELCOME10').catch(e => console.warn('Welcome email fail:', e));
    trackCustomerSignup({ email: emailTrim, name: name.trim() }).catch(e => console.warn('Klaviyo signup track fail:', e));

    // Return customer without passwordHash
    const { passwordHash, ...safeCustomer } = newCustomer;
    res.status(201).json({
      message: "Registration successful!",
      customer: safeCustomer,
      // Signs the new account in. Without a token the client would hold a
      // customer object it cannot prove belongs to it.
      token: signCustomerToken(emailTrim)
    });
  } catch (err: any) {
    console.error("[Customer Auth] Signup Error:", err);
    res.status(500).json({ error: err.message || "Failed to complete customer registration" });
  }
});

// POST: Request Password Reset Email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, recaptchaToken, token } = req.body;

    const captchaCheck = await verifyRecaptchaToken(recaptchaToken || token, 'customer_forgot_password');
    if (!captchaCheck.success) {
      return res.status(403).json({ error: captchaCheck.error || 'reCAPTCHA verification failed. Please try again.' });
    }

    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const emailTrim = email.trim().toLowerCase();
    const customersList = await fetchResource("customers");
    const found: any = customersList.find((c: any) => c.email.toLowerCase() === emailTrim);

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(24).toString("hex");
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const resetLink = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(emailTrim)}`;

    if (found) {
      found.resetCode = resetCode;
      found.resetToken = resetToken;
      found.resetTokenExpires = Date.now() + 3600000; // 1 hour
      const updatedList = customersList.map((c: any) => c.id === found.id ? found : c);
      await saveResource("customers", updatedList);
      await sendPasswordResetEmail(emailTrim, found.name, resetCode, resetLink);
    } else {
      // Send for guest / user without crashing
      await sendPasswordResetEmail(emailTrim, 'Valued Customer', resetCode, resetLink);
    }

    res.json({
      success: true,
      message: "Password reset code dispatched to your email address."
    });
  } catch (err: any) {
    console.error("[Customer Auth] Forgot Password Error:", err);
    res.status(500).json({ error: err.message || "Failed to process password reset request" });
  }
});

// POST: Perform Password Reset
router.post("/reset-password", async (req, res) => {
  try {
    const { token, code, email, newPassword, recaptchaToken } = req.body;
    const suppliedCodeOrToken = (code || token || '').toString().trim();

    const captchaCheck = await verifyRecaptchaToken(recaptchaToken, 'customer_reset_password');
    if (!captchaCheck.success) {
      return res.status(403).json({ error: captchaCheck.error || 'reCAPTCHA verification failed. Please try again.' });
    }

    if (!email || !newPassword || !suppliedCodeOrToken) {
      return res.status(400).json({ error: "Email, new password, and reset code or token are required." });
    }

    const emailTrim = email.trim().toLowerCase();
    const customersList = await fetchResource("customers");
    const found: any = customersList.find((c: any) => c.email.toLowerCase() === emailTrim);

    if (!found) {
      return res.status(404).json({ error: "Customer account not found." });
    }

    const matchesToken = found.resetToken && found.resetToken === suppliedCodeOrToken;
    const matchesCode = found.resetCode && found.resetCode === suppliedCodeOrToken;

    if (!matchesToken && !matchesCode) {
      return res.status(400).json({ error: "Invalid password reset code or token. Please check your email." });
    }

    if (found.resetTokenExpires && found.resetTokenExpires < Date.now()) {
      return res.status(400).json({ error: "Password reset code has expired. Please request a new code." });
    }

    // Update password
    found.passwordHash = hashPassword(newPassword);
    delete found.resetCode;
    delete found.resetToken;
    delete found.resetTokenExpires;

    const updatedList = customersList.map((c: any) => c.id === found.id ? found : c);
    await saveResource("customers", updatedList);

    console.log(`[Customer Auth] Password successfully reset for: ${emailTrim}`);

    const { passwordHash, ...safeCustomer } = found;
    res.json({
      success: true,
      message: "Password successfully updated. You can now log in.",
      customer: safeCustomer
    });
  } catch (err: any) {
    console.error("[Customer Auth] Reset Password Error:", err);
    res.status(500).json({ error: err.message || "Failed to reset password" });
  }
});

// POST: Request Email Verification Code
router.post("/request-verification", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const emailTrim = email.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const customersList = await fetchResource("customers");
    const found: any = customersList.find((c: any) => c.email.toLowerCase() === emailTrim);

    if (found) {
      found.verificationCode = code;
      found.verificationExpires = Date.now() + 15 * 60000; // 15 mins
      await saveResource("customers", customersList);
    }

    const emailResult = await sendEmailVerificationEmail(emailTrim, name || found?.name || 'Valued Customer', code);

    res.json({
      success: true,
      message: emailResult.success
        ? "Verification code sent to your email address."
        : "Verification code generated.",
      devNotice: !emailResult.success ? emailResult.message : undefined
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to send verification code" });
  }
});

// POST: Confirm Email Verification
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code, name } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email address and 6-digit verification code are required." });
    }

    const emailTrim = email.trim().toLowerCase();
    const codeTrim = code.toString().trim();
    const customersList = await fetchResource("customers");
    const found: any = customersList.find((c: any) => c.email.toLowerCase() === emailTrim);

    if (!found) {
      return res.status(404).json({ error: "No customer account found for this email address." });
    }

    if (found.verificationCode && found.verificationCode !== codeTrim) {
      return res.status(400).json({ error: "Invalid verification code. Please check your email and try again." });
    }

    if (found.verificationExpires && found.verificationExpires < Date.now()) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new code." });
    }

    found.emailVerified = true;
    found.emailVerifiedAt = new Date().toISOString();
    delete found.verificationCode;
    delete found.verificationExpires;
    await saveResource("customers", customersList);

    await trackEmailVerified(emailTrim, name || found?.name);

    const { passwordHash, ...safeCustomer } = found;

    res.json({
      success: true,
      message: "Email address verified successfully!",
      customer: safeCustomer
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to verify email address" });
  }
});

// POST: Customer Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;

    const captchaCheck = await verifyRecaptchaToken(recaptchaToken, 'customer_login');
    if (!captchaCheck.success) {
      return res.status(403).json({ error: captchaCheck.error || 'reCAPTCHA verification failed. Please try again.' });
    }

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const emailTrim = email.trim().toLowerCase();
    const customersList = await fetchResource("customers");
    const found: any = customersList.find((c: any) => c.email.toLowerCase() === emailTrim);

    if (!found) {
      return res.status(401).json({ error: "No account found matching this email." });
    }

    let needsUpdate = false;

    // Generate unique referral code for legacy / existing users if they don't have one or have the old format
    const hasOldFormat = found.referralCode && !found.referralCode.startsWith("REF-PS-");
    if (!found.referralCode || hasOldFormat) {
      const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const cleanFirstName = found.name.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase() || "USER";
      found.referralCode = `REF-PS-${cleanFirstName}-${codeSuffix}`;
      needsUpdate = true;
    }

    if (found.storeCredit === undefined) {
      found.storeCredit = 0;
      needsUpdate = true;
    }

    if (found.referredByCode === undefined) {
      found.referredByCode = null;
      needsUpdate = true;
    }

    // Support backward compatibility for legacy accounts without password hash
    if (found.passwordHash) {
      if (found.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ error: "Incorrect password. Please try again." });
      }
    } else {
      // If no passwordHash is set yet, we allow login on first try and save the password hash for subsequent logins
      found.passwordHash = hashPassword(password);
      needsUpdate = true;
    }

    if (needsUpdate) {
      const updatedList = customersList.map((c: any) => c.id === found.id ? found : c);
      await saveResource("customers", updatedList);
      console.log(`[Customer Auth] Initialized referral credentials or password for: ${emailTrim}`);
    }

    console.log(`[Customer Auth] Login successful: ${emailTrim}`);

    // Send login notification email to customer
    sendLoginNotificationEmail(emailTrim, found.name).catch(e => console.warn('Login notification email error:', e));

    // Return authenticated customer details safely
    const { passwordHash, ...safeCustomer } = found;
    const enrichedCustomer = await enrichCustomerAgeStatus(safeCustomer);
    res.json({
      message: "Login successful!",
      customer: enrichedCustomer,
      token: signCustomerToken(emailTrim)
    });
  } catch (err: any) {
    console.error("[Customer Auth] Login Error:", err);
    res.status(500).json({ error: err.message || "Failed to complete customer login" });
  }
});

// POST: Google / Gmail Direct OAuth Login
router.post("/google-login", async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email address is required for Google login." });
    }

    const emailTrim = email.trim().toLowerCase();
    const customerName = name || emailTrim.split("@")[0] || "Valued Customer";
    const customersList = await fetchResource("customers");

    let found: any = customersList.find((c: any) => c.email.toLowerCase() === emailTrim);

    if (found) {
      // Update verified status & info
      found.emailVerified = true;
      found.emailVerifiedAt = found.emailVerifiedAt || new Date().toISOString();
      if (picture && !found.avatarUrl) {
        found.avatarUrl = picture;
      }
      if (googleId) {
        found.googleId = googleId;
      }

      // Ensure referral code
      if (!found.referralCode) {
        const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const cleanFirstName = customerName.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase() || "USER";
        found.referralCode = `REF-PS-${cleanFirstName}-${codeSuffix}`;
      }

      await saveResource("customers", customersList);
      sendLoginNotificationEmail(emailTrim, found.name).catch(e => console.warn('Login notification email error:', e));

      const { passwordHash, ...safeCustomer } = found;
      const enrichedCustomer = await enrichCustomerAgeStatus(safeCustomer);
      return res.json({
        message: "Logged in via Google successfully!",
        customer: enrichedCustomer,
        token: signCustomerToken(emailTrim)
      });
    }

    // New Google customer signup
    const newId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleanFirstName = customerName.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase() || "USER";
    const newReferralCode = `REF-PS-${cleanFirstName}-${codeSuffix}`;

    const newCustomer = {
      id: newId,
      name: customerName,
      email: emailTrim,
      googleId: googleId || `google_${Date.now()}`,
      avatarUrl: picture || null,
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      signupDate: new Date().toISOString().split("T")[0],
      ordersCount: 0,
      totalSpent: 0,
      rewardPoints: 50, // 50 points welcome bonus!
      storeCredit: 0,
      referredByCode: null,
      referralCode: newReferralCode,
      passwordHash: hashPassword(crypto.randomBytes(16).toString("hex")),
      addresses: []
    };

    customersList.unshift(newCustomer);
    await saveResource("customers", customersList);

    // Track Klaviyo + Resend welcome email
    trackCustomerSignup(newCustomer).catch(e => console.warn('Klaviyo error:', e));
    sendWelcomeEmail(emailTrim, customerName, newReferralCode).catch(e => console.warn('Welcome email error:', e));

    const { passwordHash, ...safeCustomer } = newCustomer;
    const enrichedCustomer = await enrichCustomerAgeStatus(safeCustomer);
    return res.json({
      message: "Account created with Google!",
      customer: enrichedCustomer,
      token: signCustomerToken(emailTrim)
    });
  } catch (err: any) {
    console.error("[Customer Auth] Google Login Error:", err);
    res.status(500).json({ error: err.message || "Failed to authenticate with Google" });
  }
});

// POST: Secure Admin Login
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Admin email and password are required." });
    }

    // Credentials and the signing secret both come from the environment. This
    // used to fall back to an email and password written into this file, which
    // put the live admin credential into version control and made it
    // unchangeable without a deploy.
    if (!verifyAdminCredentials(email, password)) {
      console.warn(`[Admin Auth] Unauthorized admin login attempt with email: ${email}`);
      return res.status(401).json({ error: "Invalid admin login credentials." });
    }

    // Signed, expiring, and verified on every admin request by requireAdmin.
    // The previous random `admin-token-<hex>` string proved nothing: no endpoint
    // ever checked it, so it granted exactly the access an empty string did.
    const token = signAdminToken(String(email).trim().toLowerCase());

    console.log(`[Admin Auth] Admin login succeeded for ${email}`);
    res.json({
      success: true,
      message: "Admin access granted.",
      token,
      adminUser: {
        email: String(email).trim().toLowerCase(),
        name: "Pouch Supply Administrator"
      }
    });
  } catch (err: any) {
    if (err instanceof AdminAuthNotConfiguredError) {
      // Said distinctly: this is a server that cannot authenticate anyone, not a
      // wrong password, and an administrator needs to know which it is.
      console.error("[Admin Auth] Login refused —", err.message);
      return res.status(503).json({
        error:
          "Admin authentication is not configured on this server. Set AUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD.",
        code: "ADMIN_AUTH_NOT_CONFIGURED"
      });
    }
    console.error("[Admin Auth] Login Error:", err);
    res.status(500).json({ error: err.message || "Internal server error during admin validation" });
  }
});

// POST: Update Customer Profile & Subscription Settings
// Identified the account to edit purely from the email or id in the body, so
// anyone could rewrite anyone's profile by naming them.
router.post("/update-profile", requireCustomer, async (req: AdminRequest, res) => {
  try {
    const customerData = req.body.customer || req.body;
    if (!customerData || (!customerData.email && !customerData.id)) {
      return res.status(400).json({ error: "Customer email or id is required to update profile." });
    }

    const emailTrim = customerData.email ? customerData.email.trim().toLowerCase() : "";
    const customersList: any[] = (await fetchResource("customers")) || [];
    
    let foundIndex = -1;
    if (customerData.id) {
      foundIndex = customersList.findIndex((c: any) => c.id === customerData.id);
    }
    if (foundIndex === -1 && emailTrim) {
      foundIndex = customersList.findIndex((c: any) => c.email && c.email.toLowerCase() === emailTrim);
    }

    if (foundIndex === -1) {
      return res.status(404).json({ error: "Customer account not found." });
    }

    const existing = customersList[foundIndex];

    // Checked against the record actually found, not the email in the body: an
    // id and a mismatched email in one request must not edit someone else.
    if (!mayActOnCustomer(req, existing.email)) {
      return res.status(403).json({ error: "You can only update your own profile." });
    }

    // A shopper editing their own profile must not be able to write the fields
    // that are money or proof: their store credit balance, referral codes, or
    // the password / verification / reset secrets. These used to be spread
    // straight from the request body, so `{"storeCredit": 99999}` was a free
    // basket. Admins (support acting on an account) may still set them.
    let selfServiceData = customerData;
    if (!req.admin) {
      const PROTECTED = [
        "storeCredit", "referralCode", "referredByCode",
        "passwordHash", "password", "resetToken", "resetTokenExpires",
        "verificationCode", "verificationCodeExpires", "emailVerified", "emailVerifiedAt"
      ];
      const ignored = PROTECTED.filter(k => k in customerData && customerData[k] !== existing[k]);
      if (ignored.length) {
        console.warn(`[Customers] Ignored self-service change to protected field(s) ${ignored.join(", ")} for ${existing.email}`);
      }
      selfServiceData = { ...customerData };
      for (const k of PROTECTED) delete selfServiceData[k];
    }

    const updated = {
      ...existing,
      ...selfServiceData,
      id: existing.id, // Preserve ID
      email: existing.email, // Preserve email
      data: {
        ...(existing.data || {}),
        ...(customerData.data || {}),
        ...(customerData.subItems ? { subItems: customerData.subItems } : {}),
        ...(customerData.subPlan ? { subPlan: customerData.subPlan } : {}),
        ...(customerData.subPrice ? { subPrice: customerData.subPrice } : {}),
        ...(customerData.subFrequency ? { subFrequency: customerData.subFrequency } : {}),
        ...(customerData.subCansCount ? { subCansCount: customerData.subCansCount } : {}),
        ...(customerData.subPlanManuallyConfigured ? { subPlanManuallyConfigured: true } : {})
      }
    };

    customersList[foundIndex] = updated;
    await saveResource("customers", customersList);

    // Also sync to Prisma customer model
    try {
      await getDb();
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      await prisma.customer.updateMany({
        where: { email: existing.email },
        data: {
          name: updated.name,
          subscriptionStatus: updated.subscriptionStatus || "Not subscribed",
          subStatus: updated.subStatus || null,
          subPlan: updated.subPlan || null,
          subFrequency: updated.subFrequency || null,
          subCansCount: updated.subCansCount ? Number(updated.subCansCount) : null,
          subPrice: updated.subPrice ? Number(updated.subPrice) : null,
          nextPayment: updated.nextPayment || null,
          nextDelivery: updated.nextDelivery || null,
          data: updated as any
        }
      });
    } catch (_dbPrismaErr) {}

    const { passwordHash, ...safeCustomer } = updated;
    return res.json({
      success: true,
      message: "Customer profile updated successfully.",
      customer: safeCustomer
    });
  } catch (err: any) {
    console.error("[Customer Profile Update] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to update profile." });
  }
});

export default router;
