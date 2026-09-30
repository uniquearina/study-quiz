# Облачная копия (необязательно)

[English](CLOUD.md) | **Русский**

Тренажёр работает и без облака: двойной клик по `trainer/index.html`, прогресс в браузере. Облако нужно, если хочется заниматься и с телефона, и с компьютера с общим прогрессом.

Схема: Cloudflare Pages отдаёт папку `trainer/`, Cloudflare Access закрывает сайт входом по коду на почту, функция `/api/progress` хранит прогресс в KV и сливает изменения с разных устройств (`trainer/merge.js`). Всё умещается в бесплатный тариф.

> **Материалы курсов обычно нельзя публиковать.** Тренажёр живёт только на закрытом адресе. Основной адрес проекта Pages остаётся открытым, поэтому там лежит заглушка.

## Настройка

1. Скопируй `assets/cloud/` в папку проекта рядом с `trainer/` (получится `cloud/wrangler.toml`, `cloud/functions/`, `cloud/placeholder/`).
2. `npx wrangler login`.
3. Создай хранилище прогресса: `npx wrangler kv namespace create progress` и впиши его `id` в `cloud/wrangler.toml`. Там же задай `name` — имя проекта.
4. Создай проект Pages и выложи заглушку на основной адрес:
   ```bash
   cd cloud && npx wrangler pages project create <имя> --production-branch main
   npx wrangler pages deploy placeholder --branch main
   ```
5. В панели Cloudflare: Workers & Pages → проект → Settings → **Enable access policy** (Preview deployments). Появится приложение Access на `*.<имя>.pages.dev`. В его политике оставь вход только для своей почты.
6. В Zero Trust → Access → Applications открой это приложение и скопируй **Application Audience (AUD) Tag** в `AUD`, а имя команды (`<команда>.cloudflareaccess.com`) — в `TEAM` в `cloud/wrangler.toml`.
7. Выложи тренажёр: из папки проекта `bash ~/.claude/skills/study-quiz/scripts/deploy.sh`. Скрипт выкладывает на ветку `app` (`https://app.<имя>.pages.dev`) и проверяет, что без входа адрес закрыт, а на основном адресе тренажёра нет.

После любых изменений в `trainer/` снова запусти `deploy.sh`. Прогресс синхронизируется сам (`trainer/sync.js`): после ответов, при возврате на вкладку и при запуске. При открытии файла двойным кликом синхронизации нет.
