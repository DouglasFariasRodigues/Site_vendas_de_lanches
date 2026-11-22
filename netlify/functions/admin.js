const crypto = require("crypto");

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify(body),
});

function sign(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET nao configurado");
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verify(token) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (payload.exp * 1000 < Date.now()) return null;
  return payload;
}

function validateCredentials(username, password) {
  const allowed = [
    [process.env.ADMIN_USERNAME_1, process.env.ADMIN_PASSWORD_1],
    [process.env.ADMIN_USERNAME_2, process.env.ADMIN_PASSWORD_2],
  ];
  return allowed.some(([allowedUser, allowedPassword]) => {
    if (!allowedUser || !allowedPassword) return false;
    const userBuffer = Buffer.from(username);
    const passwordBuffer = Buffer.from(password);
    const allowedUserBuffer = Buffer.from(allowedUser);
    const allowedPasswordBuffer = Buffer.from(allowedPassword);
    return userBuffer.length === allowedUserBuffer.length &&
      passwordBuffer.length === allowedPasswordBuffer.length &&
      crypto.timingSafeEqual(userBuffer, allowedUserBuffer) &&
      crypto.timingSafeEqual(passwordBuffer, allowedPasswordBuffer);
  });
}

function getSupabaseBaseUrl() {
  const configuredUrl = process.env.SUPABASE_URL;
  if (!configuredUrl) throw new Error("SUPABASE_URL nao configurada");

  let url;
  try {
    url = new URL(configuredUrl.trim());
  } catch {
    throw new Error("SUPABASE_URL invalida. Informe a URL base do projeto Supabase.");
  }

  const path = url.pathname.replace(/\/+$/, "");
  if (path === "/rest/v1") {
    url.pathname = "";
  } else if (path && path !== "/") {
    throw new Error("SUPABASE_URL deve ser a URL base do projeto, sem caminhos adicionais.");
  }

  return url.origin;
}

function supabaseHeaders(contentType = "application/json") {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada");
  const headers = {
    apikey: key,
    "Content-Type": contentType,
  };
  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    if (event.httpMethod !== "POST") return json(405, { error: "Metodo nao permitido" });

    if (body.action === "login") {
      const username = String(body.username || "").trim();
      const password = String(body.password || "");
      if (!validateCredentials(username, password)) {
        return json(401, { error: "Usuario ou senha incorretos" });
      }
      return json(200, {
        token: sign({ username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 }),
      });
    }

    const auth = String(event.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!verify(auth)) return json(401, { error: "Sessao invalida ou expirada" });

    const supabaseUrl = getSupabaseBaseUrl();
    const headers = supabaseHeaders();

    if (body.action === "upload") {
      if (!body.dataUrl || typeof body.dataUrl !== "string") {
        return json(400, { error: "Imagem invalida" });
      }
      const match = body.dataUrl.match(/^data:(.+?);base64,(.+)$/);
      if (!match) return json(400, { error: "Formato de imagem invalido" });
      const contentType = match[1];
      const buffer = Buffer.from(match[2], "base64");
      if (buffer.length > 5 * 1024 * 1024) return json(400, { error: "Imagem maior que 5 MB" });

      const extension = contentType.includes("png") ? "png"
        : contentType.includes("webp") ? "webp"
        : contentType.includes("gif") ? "gif" : "jpg";
      const filename = `products/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${extension}`;
      const upload = await fetch(`${supabaseUrl}/storage/v1/object/${filename}`, {
        method: "PUT",
        headers: supabaseHeaders(contentType),
        body: buffer,
      });
      if (!upload.ok) return json(upload.status, { error: "Falha ao enviar imagem" });
      return json(200, { url: `${supabaseUrl}/storage/v1/object/public/${filename}` });
    }

    if (body.action === "upsert") {
      if (!body.product || !body.product.id || !body.product.name) {
        return json(400, { error: "Informe ID e nome do produto" });
      }
      const product = {
        id: body.product.id,
        name: body.product.name,
        category: body.product.category || "Outros",
        description: body.product.description || "",
        image_url: body.product.image_url || "",
        gallery: body.product.gallery || [],
        options: body.product.options || [],
        active: body.product.active !== false,
        sort_order: Number(body.product.sort_order || 0),
        updated_at: new Date().toISOString(),
      };
      const response = await fetch(`${supabaseUrl}/rest/v1/products?on_conflict=id`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(product),
      });
      const text = await response.text();
      if (!response.ok) return json(response.status, { error: text || "Falha ao salvar produto" });
      return json(200, { product });
    }

    if (body.action === "delete") {
      if (!body.id) return json(400, { error: "ID do produto ausente" });
      const response = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(body.id)}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok) return json(response.status, { error: "Falha ao excluir produto" });
      return json(200, { ok: true });
    }

    if (body.action === "list") {
      const response = await fetch(`${supabaseUrl}/rest/v1/products?select=*&order=sort_order.asc`, {
        headers,
      });
      const text = await response.text();
      if (!response.ok) return json(response.status, { error: text || "Falha ao listar produtos" });
      return json(200, { products: JSON.parse(text) });
    }

    return json(400, { error: "Acao invalida" });
  } catch (error) {
    return json(500, { error: error.message || "Erro interno" });
  }
};
