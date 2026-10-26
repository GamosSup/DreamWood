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
# --- Node.js (для облака/Google Drive): нужен 18+, в Ubuntu 22.04 из репозитория ставится слишком старый
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  NV=v22.11.0; T=/tmp/node.tar.xz
  { curl -fsS -m 120 -o $T "https://nodejs.org/dist/$NV/node-$NV-linux-x64.tar.xz" \
    || curl -fsS -m 120 -o $T "https://registry.npmmirror.com/-/binary/node/$NV/node-$NV-linux-x64.tar.xz" \
    || curl -fsS -m 120 -o $T "https://mirrors.huaweicloud.com/nodejs/$NV/node-$NV-linux-x64.tar.xz"; } \
  && { apt-get install -y -qq xz-utils >/dev/null; rm -rf /opt/node && mkdir -p /opt/node && tar -xJf $T -C /opt/node --strip-components=1 \
       && ln -sf /opt/node/bin/node /usr/local/bin/node; echo "  node: $(node -v)"; } \
  || echo "  !! Node.js не скачался — облако (Google Drive) на этом адресе работать не будет"
fi
# --- локальные копии supabase-js и шрифтов (чтобы не зависеть от CDN и Cloudflare)
mkdir -p /srv/vendor/f
SB=@supabase/supabase-js@2.57.4/dist/umd/supabase.min.js
if ! { curl -fsS -m 40 -o /srv/vendor/sbjs.tmp "https://cdn.jsdelivr.net/npm/$SB" || curl -fsS -m 40 -o /srv/vendor/sbjs.tmp "https://unpkg.com/$SB"; } || [ "$(wc -c </srv/vendor/sbjs.tmp)" -lt 50000 ]; then
  echo "  !! supabase-js не скачался — проверьте доступ сервера к cdn.jsdelivr.net / unpkg.com"
else mv /srv/vendor/sbjs.tmp /srv/vendor/sbjs; echo "  supabase-js: ок"; fi
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
if curl -fsS -m 30 -A "$UA" -o /srv/vendor/fonts.src "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Alegreya:wght@700;800&display=swap"; then
  cp /srv/vendor/fonts.src /srv/vendor/fonts.css
  for u in $(grep -o 'https://fonts.gstatic.com/[^)]*' /srv/vendor/fonts.src | sort -u); do
    p="${u#https://fonts.gstatic.com/}"; mkdir -p "/srv/vendor/f/$(dirname "$p")"
    curl -fsS -m 30 -o "/srv/vendor/f/$p" "$u" && sed -i "s#$u#/v/f/$p#g" /srv/vendor/fonts.css
  done; echo "  шрифты: ок"
else echo "  шрифты не скачались (не критично)"; echo "/* fonts unavailable */" > /srv/vendor/fonts.css; fi
# --- облако (Google Drive) на этом сервере
[ -f /etc/dreamwood.env ] || { printf '# Ключи Google Drive. Вносятся командой: dw-secrets\nFILE_SIGN_SECRET=%s\n' "$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 48)" > /etc/dreamwood.env; chmod 600 /etc/dreamwood.env; }
cat > /etc/systemd/system/dw-api.service <<'SVC'
[Unit]
Description=Dreamwood API (Google Drive)
After=network-online.target
[Service]
ExecStart=/usr/local/bin/node /srv/dreamwood/deploy/server.js
Restart=always
RestartSec=3
User=nobody
Group=nogroup
Environment=DW_ENV=/etc/dreamwood.env
[Install]
WantedBy=multi-user.target
SVC
# файл с ключами читает сам процесс; nobody должен его видеть
chown root:nogroup /etc/dreamwood.env; chmod 640 /etc/dreamwood.env
cat > /usr/local/bin/dw-secrets <<'SEC'
#!/usr/bin/env bash
# Внести ключи Google Drive на этот сервер: dw-secrets
set -e
F=/etc/dreamwood.env
get(){ grep -E "^$1=" $F 2>/dev/null | head -1 | cut -d= -f2-; }
SIGN=$(get FILE_SIGN_SECRET); [ -n "$SIGN" ] || SIGN=$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 48)
echo "Вставьте значение и нажмите Enter (при вставке символы на экране не видны — это нормально)."
read -r -s -p "GOOGLE_CLIENT_ID: " A; echo
read -r -s -p "GOOGLE_CLIENT_SECRET: " B; echo
read -r -s -p "GOOGLE_REFRESH_TOKEN: " C; echo
A=$(echo -n "$A" | tr -d '[:space:]'); B=$(echo -n "$B" | tr -d '[:space:]'); C=$(echo -n "$C" | tr -d '[:space:]')
if [ -z "$A" ] || [ -z "$B" ] || [ -z "$C" ]; then echo "Одно из значений пустое — ничего не сохранено."; exit 1; fi
printf 'GOOGLE_CLIENT_ID=%s\nGOOGLE_CLIENT_SECRET=%s\nGOOGLE_REFRESH_TOKEN=%s\nFILE_SIGN_SECRET=%s\n' "$A" "$B" "$C" "$SIGN" > $F
chown root:nogroup $F; chmod 640 $F
systemctl restart dw-api; sleep 1
R=$(curl -s -m 20 -X POST https://oauth2.googleapis.com/token -d "client_id=$A" -d "client_secret=$B" -d "refresh_token=$C" -d grant_type=refresh_token || true)
if echo "$R" | grep -q access_token; then echo "Готово: Google принял ключи, облако на этом адресе включено."
else echo "Ключи сохранены, но Google их не принял (или сервер не достучался до Google):"; echo "$R" | head -c 300; echo; fi
SEC
chmod +x /usr/local/bin/dw-secrets
mkdir -p /etc/caddy
cp /srv/dreamwood/deploy/Caddyfile /etc/caddy/Caddyfile
mkdir -p /etc/systemd/system/caddy.service.d
printf '[Service]\nEnvironment=DOMAIN=%s\n' "$DOMAIN" > /etc/systemd/system/caddy.service.d/domain.conf
# автообновление: сайт и конфигурация подтягиваются из GitHub раз в 2 минуты
cat > /usr/local/bin/dw-update <<'UPD'
#!/usr/bin/env bash
OLD=$(git -C /srv/dreamwood rev-parse HEAD)
git -C /srv/dreamwood pull -q --ff-only >/dev/null 2>&1 || exit 0
[ "$OLD" = "$(git -C /srv/dreamwood rev-parse HEAD)" ] || { git -C /srv/dreamwood diff --name-only "$OLD" HEAD | grep -qE "^(functions/|deploy/server.js)" && systemctl restart dw-api; }
if ! cmp -s /srv/dreamwood/deploy/Caddyfile /etc/caddy/Caddyfile; then
  DOMAIN=$(sed -n 's/^Environment=DOMAIN=//p' /etc/systemd/system/caddy.service.d/domain.conf) caddy validate --config /srv/dreamwood/deploy/Caddyfile --adapter caddyfile >/dev/null 2>&1 \
   && cp /srv/dreamwood/deploy/Caddyfile /etc/caddy/Caddyfile && systemctl reload caddy
fi
UPD
chmod +x /usr/local/bin/dw-update
echo '*/2 * * * * root /usr/local/bin/dw-update' > /etc/cron.d/dreamwood
DOMAIN=$DOMAIN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/tmp/caddy-validate.log 2>&1 || { echo '!! Ошибка в конфигурации Caddy:'; tail -5 /tmp/caddy-validate.log; exit 1; }
systemctl daemon-reload
systemctl enable --now dw-api >/dev/null 2>&1
systemctl restart dw-api
systemctl enable --now caddy >/dev/null 2>&1
systemctl restart caddy
echo
echo "Проверка связи сервера с базой:"
curl -s -o /dev/null -m 10 -w "  Supabase: HTTP %{http_code} за %{time_total} с\n" https://bvlwpfmtcdgfsomvwqrp.supabase.co/auth/v1/health -H "apikey: sb_publishable_S7nnUv3hs2bBZDhYhEFYew_j_S6s1sO" || echo "  Supabase: сервер НЕ достучался до базы"
echo
curl -s -o /dev/null -m 10 -w "  Google: HTTP %{http_code} за %{time_total} с\n" https://oauth2.googleapis.com/ || echo "  Google: сервер НЕ достучался"
if grep -q '^GOOGLE_REFRESH_TOKEN=' /etc/dreamwood.env; then echo "  Облако: ключи Google внесены."; else echo "  Облако: ключи Google ещё не внесены — выполните команду:  dw-secrets"; fi
echo
echo "Готово. Откройте: https://$DOMAIN"
