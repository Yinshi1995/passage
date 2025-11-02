// wa.ts
import qrcode from "qrcode-terminal";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import fs from "fs";

const AUTH_PATH = process.env.WWEBJS_AUTH_PATH || "/app/.wwebjs_auth";

export function createWA() {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: "default",
      dataPath: AUTH_PATH,
      rmMaxRetries: 1,
    }),
    puppeteer: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    },
  });

  client.on("qr", qr => {
    console.log("QR received (saving to /tmp/qr.txt)");
    fs.writeFileSync("/tmp/qr.txt", qr);  // сохраняем строку QR (base64)
    qrcode.generate(qr, { small: true });
    });
  client.on("ready", () => console.log("WhatsApp ready"));
  client.initialize();

  async function sendPhotoUrl(jid: string, url: string, caption: string) {
    const media = await MessageMedia.fromUrl(url);
    await client.sendMessage(jid, media, { caption });
  }

  async function sendPhotoFile(jid: string, filePath: string, caption: string) {
    const media = MessageMedia.fromFilePath(filePath);
    await client.sendMessage(jid, media, { caption });
  }

  async function sendText(jid: string, text: string) {
    await client.sendMessage(jid, text);
  }

  return { client, sendPhotoUrl, sendPhotoFile, sendText };
}
export type WA = ReturnType<typeof createWA>;
