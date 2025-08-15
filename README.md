![TypeScript Lightweight CMS](public/img/promo/index.png)

# TypeScript CMS

Легковесная система управления контентом на TypeScript с Express.js и SQLite.

## Возможности

- **Управление контентом**: Записи с markdown, тегами, категориями и изображениями
- **Пагинация и поиск**: Фильтрация по категориям/тегам, полнотекстовый поиск
- **Аутентификация**: JWT токены с ролевой системой (admin/user)
- **Система тем**: Темы с CSS переменными и настройками
- **Система приглашений**: Контролируемая регистрация через invite-коды
- **API**: REST API с Swagger документацией
- **Безопасность**: Rate limiting, валидация, санитизация данных

## Установка

```bash
git clone https://github.com/diviatrix/ts-cms.git
cd ts-cms
npm install
npm run dev
```

Приложение запустится на `http://localhost:7331`

## Первоначальная настройка

1. Зарегистрируйтесь на `/login`, первый зарегистрированный пользователь всегда в группе admin.
Добавить admin роль можно и через SQL:
   ```sql
   INSERT INTO user_groups (user_id, group_id) VALUES ('YOUR_USER_ID', 'admin');
   ```
2. Настройте режим регистрации в Admin Panel - OPEN, CLOSED, INVITE_ONLY
3. Настройте параметры, инвайты, пользователей и тему в админке. (Тему после сохранения надо записать на фронт)
4. Наполняйте контентом

## Команды

```bash
npm start                             # Продакшн сервер
npm run dev                           # Разработка с автоперезагрузкой
npm run lint                          # ESLint проверка
npm test                              # Запуск тестов

# Тестирование с Allure отчетами
npm run test:allure                   # Тесты + генерация + открытие Allure отчета
npm run allure:generate               # Генерировать Allure отчет из результатов
npm run allure:open                   # Открыть готовый Allure отчет
npm run allure:serve                  # Запустить сервер с Allure отчетом

# Проверка базы данных
npx ts-node server.ts --checkdb       # Проверить схему БД
npx ts-node server.ts --checkdb --fix # Исправить недостающие таблицы
```

## API эндпоинты
/docs/API_DOCUMENTATION.md
Или 
- в админке включить api_docs_enabled
- /api-docs

## Структура проекта

```
ts-cms/
├── src/                    # Backend TypeScript
│   ├── routes/            # API маршруты  
│   ├── functions/         # Бизнес-логика
│   ├── middleware/        # Express middleware
│   ├── types/             # TypeScript интерфейсы
│   └── db-adapter/        # Адаптер базы данных
├── public/                # Frontend
│   ├── js/               # Vanilla JavaScript (SPA)
│   ├── css/              # Модульный CSS
│   └── partials/         # HTML шаблоны
├── tests/                 # Тесты
└── data/                 # SQLite база данных
```

## Конфигурация

Переменные окружения:
```bash
API_PORT=7331                    # Порт сервера
CORS_ORIGIN=http://localhost:7331 # CORS origin
NODE_ENV=production              # Режим окружения
```

## Лицензия

ISC License
