# PinkPunk.Core — Инструкция по развёртыванию

## 📋 Обзор

**pinkpunk.core** — бэкенд для интернет-магазина PinkPunk.  
Стек: Node.js 19+, TypeScript, Prisma ORM, PostgreSQL, RabbitMQ, MinIO (S3).

---

## 🛠 Требования

### Системные
- **OS:** Ubuntu 20.04+ / Debian 11+
- **Node.js:** 19+
- **npm:** 9+
- **Docker & Docker Compose** (опционально)

### Сервисы
| Сервис | Версия | Порт по умолчанию | Назначение |
|--------|--------|-------------------|------------|
| PostgreSQL | 15+ | 5432 | База данных |
| RabbitMQ | 3.x | 5672 | Очередь сообщений |
| MinIO / S3 | любая | 9000 | Хранение файлов |

---

## 📁 Структура проекта

```
pinkpunk.core/
├── src/                    # Исходный код
│   ├── public_api/         # REST API
│   ├── schedule_worker/    # Фоновые задачи
│   ├── model/              # Модели данных
│   └── helper/             # Утилиты
├── prisma/
│   ├── schema.prisma       # Схема БД
│   ├── migrations/         # Миграции
│   └── seed.js             # Начальные данные
├── deployment/
│   └── init.sql            # Инициализация PostgreSQL
├── static/                 # Статические файлы
├── docker-compose.yaml     # Docker конфигурация
├── Dockerfile              # Сборка образа
├── .env                    # Переменные окружения
└── package.json
```

---

## ⚙️ Переменные окружения (.env)

```env
# === API ===
PUBLIC_API_PORT=3000

# === Database ===
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/pinkpunk

# === S3 Storage (MinIO) ===
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_DSN=http://localhost:9000
S3_BUCKET_NAME=storage

# === Auth Secrets ===
SECRET="your_bcrypt_secret"
accessTokenPrivateKey="your_access_token_key"
refreshTokenPrivateKey="your_refresh_token_key"

# === RabbitMQ ===
MESSAGE_BROKER__DSN=amqp://user:password@localhost:5672/cherry_broker

# === Payment Gateway (Alfabank) ===
PAYMENT_LOGIN=your_login
PAYMENT_PASSWORD=your_password
PAYMENT_URL=https://ecom.alfabank.by/payment/

# === Instagram API (опционально) ===
PRIMARY_TOKEN=your_instagram_token
```

---

## 🚀 Развёртывание

### Вариант 1: Docker Compose (рекомендуется)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/pinkpunkv/pinkpunk.core.git
cd pinkpunk.core

# 2. Создать .env файл
cp .env.example .env
# Отредактировать .env

# 3. Запустить все сервисы
docker-compose up -d --build

# 4. Применить миграции
docker exec -it public_api npx prisma db push

# 5. (Опционально) Загрузить seed данные
docker exec -it public_api npx prisma db seed
```

### Вариант 2: Ручная установка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/pinkpunkv/pinkpunk.core.git
cd pinkpunk.core

# 2. Установить зависимости
npm install

# 3. Создать .env файл
cp .env.example .env
# Отредактировать .env

# 4. Сгенерировать Prisma клиент
npx prisma generate

# 5. Применить миграции к БД
npx prisma db push

# 6. (Опционально) Загрузить seed данные
npx prisma db seed

# 7. Собрать проект
npm run build

# 8. Запустить API
npm run start_public_api

# 9. Запустить worker (в отдельном терминале/процессе)
npm run start_shedule_worker
```

---

## 🗄 Восстановление базы данных из бэкапа

```bash
# Формат: PostgreSQL custom dump (.dump)
pg_restore -h localhost -U postgres -d pinkpunk -c pinkpunk_backup_YYYYMMDD_HHMMSS.dump

# Или через Docker
docker exec -i data_storage pg_restore -U postgres -d pinkpunk -c < pinkpunk_backup.dump
```

---

## 🐳 Docker Compose сервисы

| Контейнер | Образ | Порты | Описание |
|-----------|-------|-------|----------|
| `data_storage` | postgres:15-alpine | 5432 | PostgreSQL |
| `file_storage` | bitnami/minio:2024 | 9000, 9001 | MinIO (S3) |
| `message_broker` | rabbitmq:3-management | 5672, 15672 | RabbitMQ |
| `public_api` | (собирается) | 3000 | REST API |
| `schedule_worker` | (собирается) | — | Фоновые задачи |

---

## 📡 API Endpoints

После запуска API доступен по адресу:
```
http://localhost:3000
```

---

## 🔧 Полезные команды

```bash
# Пересобрать проект
npm run build

# Запустить в dev режиме
npm run start

# Посмотреть логи Docker
docker-compose logs -f public_api

# Подключиться к PostgreSQL
docker exec -it data_storage psql -U postgres -d pinkpunk

# Открыть Prisma Studio (GUI для БД)
npx prisma studio
```

---

## ⚠️ Важные замечания

1. **S3 Storage:** Убедитесь, что MinIO запущен и bucket `storage` создан
2. **RabbitMQ:** Создайте vhost `cherry_broker` если используете свой RabbitMQ
3. **Миграции:** Всегда делайте бэкап перед `prisma db push` на production
4. **Секреты:** Никогда не коммитьте `.env` в репозиторий

---

## 📞 Текущая конфигурация (production)

| Параметр | Значение |
|----------|----------|
| Сервер | 87.252.246.245:2283 (SSH) |
| PostgreSQL | localhost:5432 |
| S3 (MinIO) | 91.149.142.24:9000 |
| RabbitMQ | 91.149.142.24:5672 |
| API | порт 3000 |

---

## 📦 Файлы для переноса

- [x] `pinkpunk_backup_*.dump` — бэкап БД
- [x] `.env` — переменные окружения
- [ ] Исходный код (git clone или архив)
- [ ] Файлы из MinIO (картинки товаров)

---

*Документ создан: 20.01.2026*
