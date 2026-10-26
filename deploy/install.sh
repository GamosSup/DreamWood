#!/usr/bin/env bash
# Установка «Дримвуда» на свой сервер (Ubuntu 22.04/24.04 или Debian 12). Запуск от root:
#   curl -fsSL https://raw.githubusercontent.com/GamosSup/DreamWood/main/deploy/install.sh | bash -s -- ВАШ.ДОМЕН
# Без домена скрипт сам возьмёт адрес вида 1-2-3-4.sslip.io (для проверки).
set -euo pipefail
DOMAIN="${1:-}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ca-certificates debian-keyring debian-archive-keyring apt-transport-https gnupg >/dev/null
if ! command -v caddy >/dev/null; then
  apt-get install -y -qq caddy >/dev/null 2>&1 || {
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
    apt-get update -qq && apt-get install -y -qq caddy >/dev/null
  }
fi
if [ -z "$DOMAIN" ]; then
  IP=$(curl -fsS https://api.ipify.org || curl -fsS https://ifconfig.me)
  DOMAIN="$(echo "$IP" | tr . -).sslip.io"
fi
echo "Домен: $DOMAIN"
if [ -d /srv/dreamwood/.git ]; then git -C /srv/dreamwood pull -q; else git clone -q --depth 1 https://github.com/GamosSup/DreamWood /srv/dreamwood; fi
mkdir -p /etc/caddy
cp /srv/dreamwood/deploy/Caddyfile /etc/caddy/Caddyfile
mkdir -p /etc/systemd/system/caddy.service.d
printf '[Service]\nEnvironment=DOMAIN=%s\n' "$DOMAIN" > /etc/systemd/system/caddy.service.d/domain.conf
# автообновление сайта из GitHub раз в 2 минуты
cat > /etc/cron.d/dreamwood <<'CRON'
*/2 * * * * root git -C /srv/dreamwood pull -q --ff-only >/dev/null 2>&1
CRON
systemctl daemon-reload
systemctl enable --now caddy >/dev/null 2>&1
systemctl restart caddy
echo
echo "Проверка связи сервера с базой:"
curl -s -o /dev/null -m 10 -w "  Supabase: HTTP %{http_code} за %{time_total} с\n" https://bvlwpfmtcdgfsomvwqrp.supabase.co/auth/v1/health -H "apikey: sb_publishable_S7nnUv3hs2bBZDhYhEFYew_j_S6s1sO" || echo "  Supabase: сервер НЕ достучался до базы"
curl -s -o /dev/null -m 10 -w "  Cloudflare-версия: HTTP %{http_code} за %{time_total} с\n" https://dreamwood.pages.dev/v/fonts || echo "  Cloudflare: сервер НЕ достучался"
echo
echo "Готово. Откройте: https://$DOMAIN"
