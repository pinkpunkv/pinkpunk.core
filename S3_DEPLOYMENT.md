# Zenko CloudServer (S3) — Инструкция по развёртыванию

## 📋 Обзор

**Zenko CloudServer** — open-source реализация S3-совместимого хранилища от Scality.  
Позволяет развернуть собственный S3 сервер для хранения файлов.

- **Версия:** 8.6.4
- **Node.js:** 16+
- **Порт по умолчанию:** 8000
- **Репозиторий:** https://github.com/scality/S3

---

## 🛠 Требования

### Системные
- **OS:** Ubuntu 20.04+ / Debian 11+
- **Node.js:** 16+
- **Yarn:** 1.x
- **Docker** (опционально)

### Минимальные ресурсы
- **RAM:** 512 MB+
- **Диск:** зависит от объёма данных

---

## 🚀 Быстрый старт

### Вариант 1: Docker (рекомендуется)

```bash
# Распаковать архив
tar -xzf S3.tar.gz
cd S3

# Запустить контейнер
docker run -d \
  --name cloudserver \
  -p 8000:8000 \
  -e SCALITY_ACCESS_KEY_ID=accessKey1 \
  -e SCALITY_SECRET_ACCESS_KEY=verySecretKey1 \
  -v $(pwd)/localData:/usr/src/app/localData \
  -v $(pwd)/localMetadata:/usr/src/app/localMetadata \
  zenko/cloudserver
```

### Вариант 2: Сборка своего образа

```bash
# Распаковать архив
tar -xzf S3.tar.gz
cd S3

# Собрать образ
docker build -t pinkpunk-s3 .

# Запустить
docker run -d \
  --name pinkpunk-s3 \
  -p 8000:8000 \
  -e SCALITY_ACCESS_KEY_ID=accessKey1 \
  -e SCALITY_SECRET_ACCESS_KEY=verySecretKey1 \
  -v $(pwd)/localData:/usr/src/app/localData \
  -v $(pwd)/localMetadata:/usr/src/app/localMetadata \
  pinkpunk-s3
```

### Вариант 3: Без Docker

```bash
# Распаковать архив
tar -xzf S3.tar.gz
cd S3

# Установить зависимости
yarn install --production

# Задать переменные окружения
export SCALITY_ACCESS_KEY_ID=accessKey1
export SCALITY_SECRET_ACCESS_KEY=verySecretKey1

# Запустить
yarn start
```

---

## ⚙️ Конфигурация

### Переменные окружения

| Переменная | Описание | Пример |
|------------|----------|--------|
| `SCALITY_ACCESS_KEY_ID` | Access Key для авторизации | `accessKey1` |
| `SCALITY_SECRET_ACCESS_KEY` | Secret Key для авторизации | `verySecretKey1` |
| `S3DATA` | Режим хранения (`file` или `mem`) | `file` |
| `S3METADATA` | Режим метаданных | `file` |
| `LISTEN_ADDR` | Адрес прослушивания | `0.0.0.0` |
| `LOG_LEVEL` | Уровень логирования | `info` |

### Файл config.json

Основные параметры в `config.json`:

```json
{
    "port": 8000,
    "restEndpoints": {
        "localhost": "us-east-1",
        "127.0.0.1": "us-east-1",
        "s3.yourdomain.com": "us-east-1"
    },
    "log": {
        "logLevel": "info",
        "dumpLevel": "error"
    }
}
```

### Файл conf/authdata.json (учётные записи)

```json
{
    "accounts": [{
        "name": "PinkPunk",
        "email": "admin@pinkpunk.com",
        "arn": "arn:aws:iam::123456789012:root",
        "canonicalID": "79a59df900b949e55d96a1e698fbacedfd6e09d98eacf8f8d5218e7cd47ef2be",
        "shortid": "123456789012",
        "keys": [{
            "access": "tYAcwBdPUGARViJU",
            "secret": "0LHC1Xs77wU6k6e4Ve2EFEqOnwR9z2GB"
        }]
    }]
}
```

> ⚠️ Замените ключи на ваши из `.env` файла pinkpunk.core

---

## 📁 Структура данных

```
S3/
├── localData/        # Хранилище файлов (volume)
├── localMetadata/    # Метаданные (volume)
├── conf/
│   └── authdata.json # Учётные записи
├── config.json       # Конфигурация сервера
└── ...
```

---

## 🔗 Подключение к PinkPunk.Core

В `.env` файле pinkpunk.core укажите:

```env
S3_ACCESS_KEY=tYAcwBdPUGARViJU
S3_SECRET_KEY=0LHC1Xs77wU6k6e4Ve2EFEqOnwR9z2GB
S3_DSN=http://YOUR_S3_SERVER:8000
S3_BUCKET_NAME=storage
```

---

## 🪣 Создание bucket

### Через AWS CLI

```bash
# Установить AWS CLI
pip install awscli

# Настроить credentials
aws configure
# Access Key: tYAcwBdPUGARViJU
# Secret Key: 0LHC1Xs77wU6k6e4Ve2EFEqOnwR9z2GB
# Region: us-east-1

# Создать bucket
aws --endpoint-url http://localhost:8000 s3 mb s3://storage

# Проверить
aws --endpoint-url http://localhost:8000 s3 ls
```

### Через код (Node.js)

```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    endpoint: 'http://localhost:8000',
    accessKeyId: 'tYAcwBdPUGARViJU',
    secretAccessKey: '0LHC1Xs77wU6k6e4Ve2EFEqOnwR9z2GB',
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
});

await s3.createBucket({ Bucket: 'storage' }).promise();
```

---

## 🐳 Docker Compose (полный стек)

Добавьте в `docker-compose.yaml` pinkpunk.core:

```yaml
services:
  s3_storage:
    build:
      context: ./S3
      dockerfile: Dockerfile
    container_name: s3_storage
    ports:
      - "8000:8000"
    environment:
      SCALITY_ACCESS_KEY_ID: tYAcwBdPUGARViJU
      SCALITY_SECRET_ACCESS_KEY: 0LHC1Xs77wU6k6e4Ve2EFEqOnwR9z2GB
      S3DATA: file
    volumes:
      - s3_data:/usr/src/app/localData
      - s3_metadata:/usr/src/app/localMetadata
    restart: unless-stopped

volumes:
  s3_data:
  s3_metadata:
```

И обновите `.env`:

```env
S3_DSN=http://s3_storage:8000
```

---

## 🔧 Полезные команды

```bash
# Проверить статус (healthcheck)
curl http://localhost:8000/_/healthcheck

# Посмотреть логи Docker
docker logs -f cloudserver

# Войти в контейнер
docker exec -it cloudserver /bin/bash

# Перезапустить
docker restart cloudserver
```

---

## 📡 API Endpoints

| Endpoint | Описание |
|----------|----------|
| `http://HOST:8000` | S3 API |
| `http://HOST:8000/_/healthcheck` | Health check |
| `http://HOST:8002` | Metrics (Prometheus) |

---

## ⚠️ Важные замечания

1. **Данные хранятся локально** в `localData/` — обязательно монтируйте как volume
2. **Бэкапы:** регулярно копируйте `localData/` и `localMetadata/`
3. **Production:** для production рекомендуется использовать MinIO или настоящий S3
4. **SSL:** для HTTPS используйте reverse proxy (nginx/traefik)

---

## 📦 Содержимое архива

Архив `S3.tar.gz` содержит полную копию Zenko CloudServer с сервера 87.252.246.245.

Распаковка:
```bash
tar -xzf S3.tar.gz
```

---

## 🔐 Текущие credentials (с сервера)

| Параметр | Значение |
|----------|----------|
| Access Key | `tYAcwBdPUGARViJU` |
| Secret Key | `0LHC1Xs77wU6k6e4Ve2EFEqOnwR9z2GB` |
| Bucket | `storage` |
| Endpoint | `http://91.149.142.24:9000` (текущий) |

---

*Документ создан: 20.01.2026*
