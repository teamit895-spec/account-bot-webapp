# Stats Bot Dashboard - Next.js

Современная панель управления статистикой на React/Next.js.

## 🚀 Установка

```bash
cd dashboard
npm install
```

## ⚙️ Настройка

Создайте `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🏃 Запуск

```bash
npm run dev
```

Откройте http://localhost:3000

## 📁 Структура

```
dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx      # Главная страница
│   │   ├── layout.tsx    # Лейаут
│   │   └── globals.css   # Стили
│   ├── components/
│   │   ├── Sidebar.tsx       # Навигация
│   │   ├── StatsTable.tsx    # Сводная таблица
│   │   ├── GroupCard.tsx     # Карточка группы
│   │   ├── PersonalStats.tsx # Личная статистика
│   │   ├── Recordings.tsx    # Видеозаписи
│   │   └── BotStats.tsx      # Статистика бота
│   ├── lib/
│   │   └── api.ts        # API клиент
│   └── types/
│       └── index.ts      # TypeScript типы
└── package.json
```

## 🎨 Разделы

1. **Дашборд** - общая статистика, группы, закупки ТГ
2. **Комнаты** - список комнат
3. **Группы** - детальная статистика по группам
4. **Личная статистика** - статистика по пользователям
5. **Записи** - видеозаписи работы
6. **Статистика бота** - метрики и кэш
7. **Настройки** - конфигурация

## 🔗 API

Дашборд работает с FastAPI бэкендом:
- `GET /api/dashboard` - основные данные
- `GET /api/weekly-ranking` - рейтинг за неделю
- `GET /api/personal-stats?group=` - личная статистика
- `GET /api/recordings/team?group=` - записи команды
- `GET /api/status` - статус бота
- `POST /api/cache-clear` - очистка кэша
