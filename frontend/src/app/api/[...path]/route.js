const API_BASE_URL = (
  process.env.BACKEND_API_URL ||
  "https://smart-inclusive-edapp-production.up.railway.app/api"
).replace(/\/+$/, "");

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

async function proxyRequest(request, context) {
  const { path = [] } = await context.params;
  const incomingUrl = new URL(request.url);
  const routePath = path.join("/");
  const backendPath = routePath === "login" ? "auth/login" : routePath;
  const headers = new Headers(request.headers);

  for (const header of ["host", "content-length", "connection"]) {
    headers.delete(header);
  }

  let upstream;
  try {
    upstream = await fetch(
      `${API_BASE_URL}/${backendPath}${incomingUrl.search}`,
      {
        method: request.method,
        headers,
        body:
          request.method === "GET" || request.method === "HEAD"
            ? undefined
            : await request.arrayBuffer(),
        redirect: "manual",
        cache: "no-store",
      },
    );
  } catch (error) {
    console.error("Backend API proxy request failed:", error);
    return Response.json(
      { success: false, message: "Tidak dapat terhubung ke server API." },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  for (const [name, value] of upstream.headers) {
    if (name !== "set-cookie" && !HOP_BY_HOP_HEADERS.has(name)) {
      responseHeaders.set(name, value);
    }
  }

  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  const body =
    request.method === "HEAD" ||
    upstream.status === 204 ||
    upstream.status === 304
      ? null
      : upstream.body;

  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const HEAD = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
