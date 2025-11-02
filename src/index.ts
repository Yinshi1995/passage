import { createWA } from "./wa";
import { startServer } from "./server";

// Bun автоматически подхватывает .env
const wa = createWA();
startServer(wa);
