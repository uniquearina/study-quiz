#!/bin/bash
# Выкладывает trainer/ на закрытый сайт Cloudflare Pages (ветка app) и проверяет, что без входа он закрыт.
# Запуск из папки проекта: bash <скилл>/scripts/deploy.sh      Настройка — docs/CLOUD.md.
# Тренажёр живёт на ветке app (https://app.<имя>.pages.dev), её закрывает правило Access *.<имя>.pages.dev.
# В production (основной адрес <имя>.pages.dev) тренажёр НЕ выкладывается: там только заглушка cloud/placeholder.
set -e
[ -f cloud/wrangler.toml ] || { echo "✘ Нет cloud/wrangler.toml — сначала настрой облако (docs/CLOUD.md)"; exit 1; }
NAME=$(sed -n 's/^name *= *"\(.*\)".*/\1/p' cloud/wrangler.toml)
case "$NAME" in ""|*"<"*) echo "✘ В cloud/wrangler.toml не заполнено name"; exit 1;; esac
cd cloud
npx wrangler whoami >/dev/null 2>&1 || { echo "✘ Нет входа в Cloudflare: выполни  npx wrangler login"; exit 1; }
npx wrangler pages deploy --branch app --commit-dirty=true 2>&1 | tail -2
rm -rf .wrangler
APP="https://app.$NAME.pages.dev"
for u in "$APP/" "$APP/index.html" "$APP/api/progress"; do
  c=$(curl -s -o /dev/null -w "%{http_code}" "$u")
  [ "$c" = "302" ] || { echo "✘ ТРЕВОГА: $u отвечает $c без входа — защита Access не работает!"; exit 2; }
done
p=$(curl -s "https://$NAME.pages.dev/srs.js" | head -c 200)
case "$p" in *SRS*) echo "✘ ТРЕВОГА: тренажёр открыт на основном адресе https://$NAME.pages.dev !"; exit 2;; esac
echo "✅ Выложено: $APP (без входа не открывается)"
