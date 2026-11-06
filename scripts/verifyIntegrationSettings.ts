/**
 * Verifies the centralised integration settings store against a real database.
 *
 *   SETTINGS_ENCRYPTION_KEY=... DATABASE_URL=... npx tsx scripts/verifyIntegrationSettings.ts
 *
 * Use a scratch database, not production: it writes and then deletes rows for
 * the "razorpay" and "upi" integrations.
 */
import "dotenv/config";
import assert from "assert";
import { prisma } from "../src/lib/prisma";
import { ensureNeonTablesExist } from "../serverDb";
import { decryptSecret, encryptSecret, isEncrypted, maskSecret } from "../backend/services/integrations/crypto";
import {
  getIntegrationCredentials,
  getIntegrationView,
  isIntegrationActive,
  listAudit,
  saveIntegration
} from "../backend/services/integrations/store";

let passed = 0;
async function check(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}\n    ${err?.message || err}`);
    process.exitCode = 1;
  }
}

async function rejects(p: Promise<any>, pattern: RegExp) {
  try {
    await p;
  } catch (err: any) {
    assert.match(String(err?.message), pattern);
    return;
  }
  throw new Error(`expected rejection matching ${pattern}`);
}

const SECRET = "test_secret_value_ABCDEFGH1234";

async function main() {
  if (!process.env.SETTINGS_ENCRYPTION_KEY) process.env.SETTINGS_ENCRYPTION_KEY = "x".repeat(40);
  await ensureNeonTablesExist();
  await prisma.integrationSetting.deleteMany({ where: { id: { in: ["razorpay", "upi"] } } });
  await prisma.integrationAuditLog.deleteMany({ where: { integrationId: { in: ["razorpay", "upi"] } } });

  console.log("crypto");
  await check("round-trips a secret", () => assert.equal(decryptSecret(encryptSecret(SECRET)), SECRET));
  await check("uses a fresh IV per encryption", () => assert.notEqual(encryptSecret(SECRET), encryptSecret(SECRET)));
  await check("rejects tampered ciphertext", () => {
    const enc = encryptSecret(SECRET);
    const tampered = enc.slice(0, -3) + (enc.endsWith("A") ? "BBB" : "AAA");
    assert.throws(() => decryptSecret(tampered));
  });
  await check("masks to last four only", () => assert.equal(maskSecret(SECRET), "••••••••1234"));
  await check("short secrets show nothing", () => assert.equal(maskSecret("abc123"), "••••••••"));

  console.log("store");
  await check("starts not configured", async () => {
    const v = await getIntegrationView("razorpay");
    assert.equal(v!.status, "not_configured");
    assert.equal(v!.enabled, false);
  });
  await check("refuses to enable without credentials", () =>
    rejects(saveIntegration("razorpay", { enabled: true }, "verify"), /cannot be enabled/));
  await check("refuses a live key in test mode", () =>
    rejects(
      saveIntegration("razorpay", { enabled: true, mode: "test", values: { keyId: "rzp_live_abc", keySecret: SECRET } }, "verify"),
      /live key/
    ));
  await check("nothing was written by the rejected saves", async () => {
    assert.equal(await prisma.integrationSetting.findUnique({ where: { id: "razorpay" } }), null);
  });
  await check("saves credentials with the secret encrypted at rest", async () => {
    await saveIntegration("razorpay", { mode: "test", values: { keyId: "rzp_test_abc", keySecret: SECRET } }, "verify");
    const row = await prisma.integrationSetting.findUnique({ where: { id: "razorpay" } });
    const stored = (row!.secrets as any).keySecret;
    assert.ok(isEncrypted(stored), "secret not encrypted");
    assert.ok(!JSON.stringify(row).includes(SECRET), "plaintext secret found in row");
  });
  await check("view exposes only the mask", async () => {
    const v = await getIntegrationView("razorpay");
    assert.equal(v!.fields.keySecret.value, "••••••••1234");
    assert.ok(!JSON.stringify(v).includes(SECRET));
    assert.equal(v!.status, "disabled");
  });
  await check("posting the mask back leaves the secret unchanged", async () => {
    await saveIntegration("razorpay", { values: { keySecret: "••••••••1234" } }, "verify");
    assert.equal((await getIntegrationCredentials("razorpay")).values.keySecret, SECRET);
  });
  await check("a blank secret leaves the secret unchanged", async () => {
    await saveIntegration("razorpay", { values: { keySecret: "" } }, "verify");
    assert.equal((await getIntegrationCredentials("razorpay")).values.keySecret, SECRET);
  });
  await check("enables once configured", async () => {
    const v = await saveIntegration("razorpay", { enabled: true }, "verify");
    assert.equal(v!.enabled, true);
    assert.equal(v!.status, "untested");
    assert.equal(await isIntegrationActive("razorpay"), true);
  });
  await check("clearing a required secret while enabled is refused", () =>
    rejects(saveIntegration("razorpay", { clearSecrets: ["keySecret"] }, "verify"), /cannot be enabled/));
  await check("disable then clear works", async () => {
    await saveIntegration("razorpay", { enabled: false }, "verify");
    await saveIntegration("razorpay", { clearSecrets: ["keySecret"] }, "verify");
    assert.equal(await isIntegrationActive("razorpay"), false);
    assert.equal((await getIntegrationView("razorpay"))!.fields.keySecret.set, false);
  });
  await check("invalid select values are rejected", () =>
    rejects(saveIntegration("upi", { values: { provider: "paypal" } }, "verify"), /invalid/i));
  await check("wrong encryption key reports misconfigured, not a crash", async () => {
    await saveIntegration("razorpay", { values: { keySecret: SECRET } }, "verify");
    const real = process.env.SETTINGS_ENCRYPTION_KEY;
    process.env.SETTINGS_ENCRYPTION_KEY = "y".repeat(40);
    try {
      assert.equal((await getIntegrationView("razorpay"))!.status, "misconfigured");
      await rejects(getIntegrationCredentials("razorpay"), /cannot be decrypted/);
    } finally {
      process.env.SETTINGS_ENCRYPTION_KEY = real;
    }
  });
  await check("secrets are refused when no encryption key is set", async () => {
    const real = process.env.SETTINGS_ENCRYPTION_KEY;
    delete process.env.SETTINGS_ENCRYPTION_KEY;
    try {
      await rejects(saveIntegration("razorpay", { values: { keySecret: "another_secret_value_xyz" } }, "verify"), /SETTINGS_ENCRYPTION_KEY/);
    } finally {
      process.env.SETTINGS_ENCRYPTION_KEY = real;
    }
  });
  await check("environment fallback is reported as such", async () => {
    process.env.CLOUDINARY_CLOUD_NAME = "env-cloud";
    const v = await getIntegrationView("cloudinary");
    assert.equal(v!.fields.cloudName.source, "env");
    assert.equal(v!.fields.cloudName.value, "env-cloud");
  });
  await check("audit log records field names and never values", async () => {
    const rows = await listAudit("razorpay");
    assert.ok(rows.length >= 3, `only ${rows.length} audit rows`);
    assert.ok(rows.some(r => r.changedFields.includes("keySecret")));
    assert.ok(!JSON.stringify(rows).includes(SECRET), "secret value in audit log");
  });

  await prisma.integrationSetting.deleteMany({ where: { id: { in: ["razorpay", "upi"] } } });
  await prisma.integrationAuditLog.deleteMany({ where: { integrationId: { in: ["razorpay", "upi"] } } });
  console.log(`\n${passed} checks passed${process.exitCode ? ", some FAILED" : ""}.`);
  await prisma.$disconnect();
}

main().catch(async err => {
  console.error(err);
  process.exitCode = 1;
  await prisma.$disconnect();
});
