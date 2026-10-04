const DONATION_AMOUNTS = new Set([1, 2, 3, 4, 5, 10, 15, 20, 30, 50]);
const RAMZFA_API = "https://api.ramzfa.com/api/public";

function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function findAccessToken(payload) {
  if (!payload || typeof payload !== "object") return null;

  for (const key of ["accessToken", "access_token", "token"]) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 12) return value;
  }

  for (const value of Object.values(payload)) {
    if (value && typeof value === "object") {
      const nested = findAccessToken(value);
      if (nested) return nested;
    }
  }

  return null;
}

function isRamzfaCheckout(value) {
  if (typeof value !== "string") return false;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return (
      (host === "ramzfa.com" || host.endsWith(".ramzfa.com") ||
        host === "ramzfa.net" || host.endsWith(".ramzfa.net")) &&
      host !== "api.ramzfa.com"
    );
  } catch {
    return false;
  }
}

function findCheckoutUrl(payload) {
  if (!payload || typeof payload !== "object") return null;

  for (const key of [
    "paymentUrl",
    "payment_url",
    "checkoutUrl",
    "checkout_url",
    "publicUrl",
    "public_url",
    "url",
  ]) {
    if (isRamzfaCheckout(payload[key])) return payload[key];
  }

  for (const value of Object.values(payload)) {
    if (isRamzfaCheckout(value)) return value;

    if (value && typeof value === "object") {
      const nested = findCheckoutUrl(value);
      if (nested) return nested;
    }
  }

  return null;
}

async function parseDonationAmount(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return Number(body?.amount);
  }

  const form = await request.formData();
  return Number(form.get("amount"));
}

async function createRamzfaDonation(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");

  if (origin && origin !== url.origin) {
    return json({ ok: false, error: "origin_not_allowed" }, { status: 403 });
  }

  if (!env.RAMZFA_API_KEY) {
    return json(
      { ok: false, error: "payment_not_configured" },
      { status: 503 },
    );
  }

  let amount;

  try {
    amount = await parseDonationAmount(request);
  } catch {
    return json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  if (!Number.isInteger(amount) || !DONATION_AMOUNTS.has(amount)) {
    return json({ ok: false, error: "invalid_amount" }, { status: 400 });
  }

  const authResponse = await fetch(`${RAMZFA_API}/auth/token`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.RAMZFA_API_KEY,
    },
    body: "{}",
  });

  if (!authResponse.ok) {
    return json({ ok: false, error: "payment_auth_failed" }, { status: 502 });
  }

  const authPayload = await authResponse.json();
  const accessToken = findAccessToken(authPayload);

  if (!accessToken) {
    return json({ ok: false, error: "payment_auth_invalid" }, { status: 502 });
  }

  const invoiceResponse = await fetch(`${RAMZFA_API}/invoices`, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount,
      description: `حمایت ${amount} دلاری از دیتابیس انتخاب رشته`,
      payableCurrencies: ["USDT"],
      payableNetworks: ["TRC20", "BEP20"],
      successUrl: `${url.origin}/support/success/`,
      cancelUrl: `${url.origin}/support/cancel/`,
      metadata: {
        type: "project_support",
        amountUsd: amount,
      },
    }),
  });

  if (!invoiceResponse.ok) {
    return json({ ok: false, error: "invoice_creation_failed" }, { status: 502 });
  }

  const invoicePayload = await invoiceResponse.json();
  const checkoutUrl = findCheckoutUrl(invoicePayload);

  if (!checkoutUrl) {
    return json({ ok: false, error: "checkout_url_missing" }, { status: 502 });
  }

  return Response.redirect(checkoutUrl, 303);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        runtime: "cloudflare-worker",
      });
    }

    if (url.pathname === "/api/donate/create") {
      if (request.method !== "POST") {
        return json(
          { ok: false, error: "method_not_allowed" },
          {
            status: 405,
            headers: { allow: "POST" },
          },
        );
      }

      return createRamzfaDonation(request, env);
    }

    if (url.pathname === "/api/d1-check") {
      if (!env.DB) {
        return json(
          {
            ok: false,
            connected: false,
            error: "D1 binding is not configured yet",
          },
          { status: 503 },
        );
      }

      try {
        const result = await env.DB.prepare("SELECT 1 AS connected").first();

        return json({
          ok: true,
          connected: result?.connected === 1,
        });
      } catch (error) {
        return json(
          {
            ok: false,
            connected: false,
            error: error instanceof Error ? error.message : "D1 check failed",
          },
          { status: 500 },
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
};
