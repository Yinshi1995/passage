# Node + Bun
FROM node:20 as base
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Chromium и зависимости
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libxcomposite1 libxrandr2 libxdamage1 libxkbcommon0 \
    libpango-1.0-0 libgbm1 libasound2 libatspi2.0-0 \
    libpangocairo-1.0-0 libxshmfence1 libxfixes3 \
    libwayland-client0 libwayland-cursor0 libwayland-egl1 \
    xdg-utils fonts-liberation \
 && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=1
ENV WWEBJS_AUTH_PATH=/app/.wwebjs_auth

WORKDIR /app

# Копируем манифесты отдельно — кэш сборки устойчивее
COPY package.json ./
# при наличии — раскомментируйте:
# COPY bun.lockb ./

# Копируем весь проект, включая .wwebjs_auth
# (комментарий на отдельной строке!)
COPY . .

# гарантируем существование каталога для авторизации
RUN mkdir -p "$WWEBJS_AUTH_PATH" && chmod -R 700 "$WWEBJS_AUTH_PATH" || true

RUN bun install

CMD ["bun", "run", "src/index.ts"]
