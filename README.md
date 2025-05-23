# 📦 АРМ работника склада

[🔗 Перейти к приложению](https://whous.ru)

[🛠️ Перейти в Kanban](https://github.com/users/inekruz/projects/3)

Веб-приложение для автоматизации складских процессов: приемка, отгрузка, учет, перемещение, инвентаризация и история операций.

---

## 🛠️ Технологии

- **Frontend**: ReactJS  
- **Backend**: Node.js + Express  
- **База данных**: PostgreSQL  
- **Протокол**: HTTPS + REST API  
- **Тестирование**: Jest (сервер), UI Kit (клиент)  
- **Запросы**: Fetch/Axios (POST/GET/PUT/DELETE)

---

## 🔐 Безопасность

- Шифрование данных (SSL/TLS)
- Хеширование паролей (bcrypt)
- Аутентификация: JWT  
- Роли пользователей (админ, кладовщик)
- Защита от XSS / CSRF / SQL Injection

---

## 📋 Ключевой функционал

### 👤 Пользователи
- Регистрация с ролями  
- Вход по логину + коду сотрудника  
- Разграничение доступа (RBAC)

### 📦 Товары
- CRUD операции с товарами  
- Фильтрация и поиск  
- Учёт партий и серийных номеров  

### 🚚 Операции
- Документы на приемку/отгрузку  
- Инвентаризация и перемещения  
- История действий (журнал событий)  
- Уведомления о низких остатках и ошибках  

---

## 🧱 Архитектура

.env Frontend
```
PORT=
REACT_APP_KEY=
```
.env Backend
```
PORT=
AUTH_TOKEN=
PG_USER=
PG_PASSWORD=
PG_HOST=
PG_PORT=
PG_DATABASE=
```
