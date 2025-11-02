// server.ts
import { sql } from "./db";
import { join } from "node:path";
import { stat } from "node:fs/promises";

function badRequest(msg: string) { return new Response(msg, { status: 400 }); }
function unauthorized() { return new Response("unauthorized", { status: 401 }); }

export function startServer(wa: { sendPhotoFile: Function; sendPhotoUrl: Function; sendText: Function; }) {
  const port   = Number(process.env.PORT || 3000);
  const chat   = process.env.WHATSAPP_JID!;
  const apiKey = process.env.API_KEY!;
  const imagesDir = process.env.IMAGES_DIR || "./images"; // локальная папка

  // helper: нормализуем имя, если image = NULL
  const nameFromUid = (uid: string) => uid.replace(/:/g, "_") + ".jpg"; // вы используете *_*.jpg

  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      if (req.headers.get("x-api-key") !== apiKey) return unauthorized();

      if (url.pathname === "/health") return new Response("ok");

      if (url.pathname === "/visit" && req.method === "POST") {
        let body: any;
        try { body = await req.json(); } catch { return badRequest("invalid json"); }
        const uid = String(body?.uid || "").trim();
        if (!uid) return badRequest("missing uid");

        const card = await sql/*sql*/`SELECT id, uid, image FROM cards WHERE uid=${uid} LIMIT 1`.then(r => r[0]);

        // лог посещения
        if (card) await sql/*sql*/`INSERT INTO visits (card_id, uid) VALUES (${card.id}, ${uid})`;
        else      await sql/*sql*/`INSERT INTO visits (uid) VALUES (${uid})`.catch(()=>{});

        const iso = new Date().toISOString();

        if (!card) {
          await wa.sendText(chat, `Unknown UID ${uid}\nTime: ${iso}`);
          return Response.json({ ok: true, unknown: true });
        }

        // определяем имя файла
        const fileName = (card.image && card.image.trim().length > 0)
          ? card.image
          : nameFromUid(uid);

        const filePath = join(imagesDir, fileName);

        // проверим, что файл существует
        try { await stat(filePath); }
        catch {
          await wa.sendText(chat, `Image not found for UID ${uid} (expected: ${fileName})\nTime: ${iso}`);
          return Response.json({ ok: true, image: "missing" });
        }

        const caption = `UID: ${uid}\nTime: ${iso}`;
        await wa.sendPhotoFile(chat, filePath, caption);  // локальная картинка

        return Response.json({ ok: true, file: fileName });
      }

      return new Response("not found", { status: 404 });
    }
  });

  console.log(`HTTP listening on http://localhost:${port}`);
  console.log(`Images dir: ${imagesDir}`);
  return server;
}
