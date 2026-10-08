function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function cachePolicyFor(pathname, contentType = "") {
  if (pathname === "/sw.js") {
    return "no-cache, must-revalidate";
  }

  if (pathname.startsWith("/_next/static/")) {
    return "public, max-age=31536000, immutable";
  }

  if (pathname.startsWith("/assets/")) {
    return "public, max-age=2592000, stale-while-revalidate=604800";
  }

  if (pathname === "/entekhab-yar/data.json") {
    return "public, max-age=86400, stale-while-revalidate=604800";
  }

  if (pathname === "/entekhab-yar/IRANSansX.woff2") {
    return "public, max-age=31536000, immutable";
  }

  if (pathname.startsWith("/entekhab-yar/")) {
    return "public, max-age=3600, stale-while-revalidate=86400";
  }

  if (pathname === "/data/index.json" || pathname === "/data/manifest.json") {
    return "public, max-age=86400, stale-while-revalidate=604800";
  }

  if (pathname.startsWith("/data/")) {
    return "public, max-age=86400, stale-while-revalidate=604800";
  }

  if (
    pathname === "/" ||
    pathname.endsWith(".html") ||
    contentType.includes("text/html")
  ) {
    return "public, max-age=3600, stale-while-revalidate=86400";
  }

  return null;
}

function withAssetCacheHeaders(response, pathname) {
  if (!response.ok && response.status !== 304) {
    return response;
  }

  const headers = new Headers(response.headers);
  const policy = cachePolicyFor(
    pathname,
    headers.get("content-type") || "",
  );

  if (policy) {
    headers.set("cache-control", policy);
  }

  if (pathname === "/sw.js") {
    headers.set("service-worker-allowed", "/");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);


    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        runtime: "cloudflare-worker",
      });
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

    const response = await env.ASSETS.fetch(request);
    return withAssetCacheHeaders(response, url.pathname);
  },
};

export default worker;
