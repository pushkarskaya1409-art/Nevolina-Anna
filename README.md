# Сайт-портфолио Анны Неволиной

Репозиторий: `pushkarskaya1409-art/Nevolina-Anna`
Сайт: `https://anna-nevolina.tuqo.ru`

## Публикация изменений

1. Decap CMS использует `turbo-github` и ветку `main`.
2. Каждое сохранение в админке создаёт commit в GitHub.
3. Tuqo Git CD должен быть подключён к этому же репозиторию и ветке `main`; каждый push запускает сборку `npm ci && npm run build` и публикует `dist/`.
4. После сохранения в админке проверяйте новый commit в GitHub и статус деплоя в Tuqo.

## Админка
`https://anna-nevolina.tuqo.ru/admin/`

Важно: в `admin/config.yml` нужно сохранить реальный `turbo_site_id` из Decap Turbo. Этот ID намеренно не записан в архив.
