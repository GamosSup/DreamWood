# Файлы сайта на Google Drive — настройка (один раз, ~15 минут)

Пока секреты не заданы, сайт работает как раньше (файлы идут в Supabase). Как только они появятся, новые фото и видео
из заявок на поломки, происшествий и задач DreamGile сами уходят на Drive:

`Дримвуд — файлы сайта / <Поломки | Происшествия | Задачи DreamGile> / 2026-10 / 2026-10-25 / 2026-10-25_2314_Золото_Шубчик И._ab12.jpg`

Подпись в имени: дата, время (Москва), зона/название, кто загрузил. Ограничение на один файл — 95 МБ.
Старые файлы остаются в Supabase и продолжают открываться.

## 1. Проект и доступ к Drive
1. https://console.cloud.google.com → вверху «Create project» → название «Dreamwood» → Create.
2. Меню → **APIs & Services → Library** → найти **Google Drive API** → **Enable**.

## 2. Экран согласия
1. **APIs & Services → OAuth consent screen** (в новом интерфейсе — «Google Auth Platform»).
2. Тип **External**, название «Дримвуд», твоя почта в двух полях контактов.
3. **Scopes → Add** → отметить `.../auth/drive.file` («См., изменять и удалять только файлы, созданные этим приложением»).
4. Нажать **Publish app → In production**. Это важно: иначе ключ перестанет работать через 7 дней. Проверка Google для такого доступа не требуется.

## 3. Ключи
1. **APIs & Services → Credentials → Create credentials → OAuth client ID** → тип **Web application**.
2. В **Authorized redirect URIs** добавить `https://developers.google.com/oauthplayground`.
3. Create → скопировать **Client ID** и **Client secret**.

## 4. Разрешение от твоего аккаунта
1. https://developers.google.com/oauthplayground → шестерёнка справа → поставить **Use your own OAuth credentials** → вставить Client ID и Client secret.
2. Слева в поле ввода вписать `https://www.googleapis.com/auth/drive.file` → **Authorize APIs** → войти своим аккаунтом (где 5 ТБ) → если Google пишет «приложение не проверено», **Дополнительно → Перейти** → **Разрешить**.
3. **Exchange authorization code for tokens** → скопировать **Refresh token**.

## 5. Секреты в Cloudflare
Cloudflare → Workers & Pages → проект **dreamwood** → **Settings → Variables and Secrets → Add** (тип **Secret**, окружение Production):

| Имя | Значение |
|---|---|
| `GOOGLE_CLIENT_ID` | из шага 3 |
| `GOOGLE_CLIENT_SECRET` | из шага 3 |
| `GOOGLE_REFRESH_TOKEN` | из шага 4 |
| `FILE_SIGN_SECRET` | любая случайная строка от 40 символов |

Потом **Deployments → последний деплой → Retry deployment**, чтобы секреты подхватились.

## 6. Проверка
Отправь заявку на поломку с фото. На Drive появится папка «Дримвуд — файлы сайта», а в ней по месяцам и дням файл с подписью.

Секреты никому не присылай (в том числе в чат): они вводятся только в Cloudflare.
