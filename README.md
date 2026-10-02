# Сайт-портфолио Анны Неволиной — финальная версия

Репозиторий: `pushkarskaya1409-art/Nevolina-Anna`
Ветка: `main`
Сайт: `https://anna-nevolina.tuqo.ru`
Админка: `https://anna-nevolina.tuqo.ru/admin/`

## Как работает публикация

1. Decap CMS использует backend `turbo-github` и ветку `main`.
2. Сохранение в админке создаёт commit в GitHub.
3. Tuqo Git CD должен быть подключён к этому же репозиторию и ветке `main`.
4. Tuqo запускает `npm ci && npm run build` и публикует папку `dist/`.

## ВАЖНО

В `admin/config.yml` нужно один раз заменить:

`REPLACE_WITH_DECAP_TURBO_SITE_ID`

на настоящий **Site ID** из Decap Turbo → Overview.

Репозиторий и ветку `main` в `config.yml` вручную указывать не нужно: для Turbo репозиторий берётся из настроек сайта Turbo, а `branch: main` фиксирует рабочую ветку.

## Проверка перед деплоем

```bash
npm ci
npm run build
```

После сборки должны появиться:

- `dist/index.html`
- страницы разделов
- страницы портфолио
- `dist/blog.html`
- страницы публикаций блога
- `dist/sitemap.xml`
- `dist/robots.txt`
- `dist/admin/`

Sitemap автоматически создаётся с доменом `https://anna-nevolina.tuqo.ru/`.

## SEO

В проекте подготовлены:

- `sitemap.xml`
- `robots.txt`
- canonical URL
- meta description
- keywords
- Open Graph
- Schema.org Person
- поля для Google Search Console и Яндекс Вебмастера

Коды верификации Google/Yandex добавляются через админку после получения их от поисковиков.
