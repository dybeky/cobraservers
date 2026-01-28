# BattleMetrics Proxy Worker

Cloudflare Worker для проксирования запросов к BattleMetrics API.

## Зачем нужен Worker?

BattleMetrics API требует OAuth токен для доступа к некоторым эндпоинтам. Хранить токен в клиентском JavaScript небезопасно, поэтому мы используем Cloudflare Worker как прокси-сервер, который добавляет токен к запросам.

## Быстрый старт

### 1. Получите BattleMetrics API токен

1. Перейдите на [BattleMetrics Developers](https://www.battlemetrics.com/developers)
2. Создайте OAuth приложение или персональный токен доступа
3. Скопируйте токен

### 2. Создайте Cloudflare Worker

**Вариант A: Через веб-интерфейс**
1. Зарегистрируйтесь на [Cloudflare](https://cloudflare.com) (бесплатно)
2. Перейдите в Workers & Pages
3. Создайте новый Worker
4. Скопируйте содержимое `battlemetrics-proxy.js` в редактор
5. Добавьте переменную окружения `BATTLEMETRICS_TOKEN`
6. Сохраните и задеплойте

**Вариант B: Через Wrangler CLI**
```bash
# Установите Wrangler
npm install -g wrangler

# Авторизуйтесь
wrangler login

# Задеплойте
wrangler deploy

# Добавьте секрет
wrangler secret put BATTLEMETRICS_TOKEN
```

### 3. Обновите URL в коде

Откройте `js/stats-api.js` и замените:
```javascript
workerUrl: 'https://battlemetrics-proxy.YOUR_SUBDOMAIN.workers.dev'
```
на ваш реальный URL воркера.

## API Endpoints

### GET /history

Получить историю онлайна игроков.

**Параметры:**
- `server` (required) - ID сервера BattleMetrics
- `start` - Начальная дата (ISO 8601)
- `stop` - Конечная дата (ISO 8601)
- `resolution` - Разрешение данных: `raw`, `60`, `1440`

**Пример:**
```
/history?server=34747819&start=2024-01-01T00:00:00Z&stop=2024-01-02T00:00:00Z&resolution=60
```

### GET /leaderboard

Получить топ игроков по времени.

**Параметры:**
- `server` (required) - ID сервера BattleMetrics
- `period` - Период: `7d` или `30d`

**Пример:**
```
/leaderboard?server=34747819&period=7d
```

## Лимиты

- Cloudflare Workers Free plan: 100,000 запросов/день
- BattleMetrics API: Зависит от типа аккаунта

## Кеширование

Worker кеширует ответы на 5 минут. Это снижает нагрузку на BattleMetrics API и ускоряет ответы.

## Безопасность

- Токен хранится как секретная переменная окружения
- CORS ограничен списком разрешённых доменов
- Только GET запросы разрешены
