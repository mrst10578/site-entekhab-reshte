function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
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

    return env.ASSETS.fetch(request);
  },
};

export default worker;
