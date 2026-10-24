# Дримвуд — приложение команды

PWA без сборки: `index.html` + `app.js` + Supabase (вход по приглашению, общая база, роли).

## Запуск
1. **Supabase → SQL Editor**: выполни `supabase/schema.sql`, затем `supabase/seed_rotation_2026-10-24.sql`.
2. **Authentication → Providers → Email**: выключи «Allow new users to sign up» (вход только по приглашению). Приглашай людей: Authentication → Users → Invite user.
3. Первого руководителя назначь вручную: `update profiles set role='manager' where id = '<uuid>';`
4. В `config.js` вставь `anon public` key (Project Settings → API). Это публичное значение; service_role key сюда нельзя.
5. **Cloudflare Pages → Connect to Git**: репозиторий, build command пустой, output directory `/`.

## Роли
Сотрудник правит только свои отметки графика; руководитель видит и правит всех, загружает ротации, новости и афишу (правила RLS в `schema.sql`).

## Дальше
Форма новостей/афиши для руководителей, загрузка ротации из файла, инфографика ротаций (маршрут Альфы, обеды), данные афиши.
