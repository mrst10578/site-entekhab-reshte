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

const ENTEKHAB_YAR_SOURCE =
  "https://raw.githubusercontent.com/wazyxoi/major-helper/5ae840b255d303200895acee2cf8b5577ab0c918";

async function proxyPinnedAsset(pathname) {
  const sourcePath =
    pathname === "/entekhab-yar/data.json"
      ? "data.json"
      : pathname === "/entekhab-yar/IRANSansX.woff2"
        ? "IRANSansX.woff2"
        : null;

  if (!sourcePath) return null;

  const upstream = await fetch(`${ENTEKHAB_YAR_SOURCE}/${sourcePath}`, {
    cf: {
      cacheEverything: true,
      cacheTtl: sourcePath === "data.json" ? 86400 : 31536000,
    },
  });

  if (!upstream.ok) {
    return new Response("Entekhab Yar source asset is temporarily unavailable.", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const headers = new Headers(upstream.headers);
  headers.set(
    "cache-control",
    sourcePath === "data.json"
      ? "public, max-age=86400, stale-while-revalidate=604800"
      : "public, max-age=31536000, immutable",
  );
  headers.set("x-source-revision", "wazyxoi/major-helper@5ae840b255d303200895acee2cf8b5577ab0c918");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    const proxiedAsset = await proxyPinnedAsset(url.pathname);
    if (proxiedAsset) return proxiedAsset;

    if (url.pathname === "/entekhab-yar") {
      return Response.redirect(new URL("/entekhab-yar/", url), 308);
    }

    if (url.pathname === "/entekhab-yar/") {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = "/entekhab-yar/index.html";
      const assetRequest = new Request(assetUrl, request);
      const response = await env.ASSETS.fetch(assetRequest);
      return withAssetCacheHeaders(response, "/entekhab-yar/index.html");
    }

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
