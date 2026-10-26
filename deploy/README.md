# Свой сервер для «Дримвуда»

Запасной адрес приложения на российском (или любом) VPS. Сервер отдаёт сайт и пересылает запросы к базе Supabase;
облако (Google Drive) работает на самом сервере (deploy/server.js — те же функции, что у Cloudflare), пуши идут через Cloudflare-версию (она остаётся рабочей параллельно).

1. Создать VPS: Ubuntu 22.04, 1 ядро, 1 ГБ, любой хостинг (Timeweb Cloud, Selectel, Beget, Yandex Cloud).
2. (Желательно) купить домен и направить A-запись на IP сервера.
3. В консоли сервера под root выполнить:
   `curl -fsSL https://raw.githubusercontent.com/GamosSup/DreamWood/main/deploy/install.sh | bash -s -- ВАШ.ДОМЕН`
   (без домена: `... | bash`, адрес будет вида `1-2-3-4.sslip.io`).
4. Скрипт в конце покажет, видит ли сервер Supabase и Cloudflare. Если «НЕ достучался» — сервер в неподходящей
   локации: пересоздать в другом городе или стране.
5. Облако: после установки выполнить `dw-secrets` и вставить GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN (см. docs/DRIVE_SETUP.md, шаги 3–4). Команда сама проверит ключи у Google.
6. Сайт сам обновляется из GitHub каждые 2 минуты.
