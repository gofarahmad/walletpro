# PayFin - MySQL Setup Guide

## Prerequisites

- MySQL 5.7+ atau MySQL 8.0+
- Node.js 16+ dan npm
- Git (optional)

## Setup Database

### 1. Install MySQL

Download dan install MySQL dari [mysql.com](https://dev.mysql.com/downloads/mysql/)

### 2. Create Database

Buka MySQL command line atau MySQL Workbench, kemudian jalankan:

```bash
# Login ke MySQL
mysql -u root -p

# Atau jika tidak ada password
mysql -u root
```

### 3. Import Schema dan Seed Data

```sql
-- Import schema
source D:/Finance/database/schema.sql

-- Import seed data
source D:/Finance/database/seed.sql
```

Atau menggunakan command line:

```bash
mysql -u root -p wealthwise < D:/Finance/database/schema.sql
mysql -u root -p wealthwise < D:/Finance/database/seed.sql
```

### 4. Verify Database

```sql
USE wealthwise;
SHOW TABLES;
SELECT * FROM users;
```

## Setup Backend Server

### 1. Install Dependencies

```bash
cd D:/Finance/server
npm install
```

### 2. Configure Environment

Edit file `.env` di folder `server`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=wealthwise
DB_PORT=3306
PORT=3001
```

### 3. Start Backend Server

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3001`

## Setup Frontend

### 1. Install Dependencies (jika belum)

```bash
cd D:/Finance
npm install axios
```

### 2. Start Frontend

```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## Testing

### 1. Test Backend API

Buka browser dan akses:
- Health check: http://localhost:3001/api/health
- Get users: http://localhost:3001/api/auth/users

### 2. Test Full Application

1. Buka http://localhost:5173
2. Login dengan:
   - Phone: `081234567890`
   - PIN: `1234`
3. Test fitur-fitur aplikasi

## Default Users

Setelah import seed data, tersedia 2 user:

| Name | Phone | PIN |
|------|-------|-----|
| Alex Rivera | 081234567890 | 1234 |
| Maya Chen | 081234567891 | 1234 |

## Troubleshooting

### MySQL Connection Error

```
Error: ER_ACCESS_DENIED_ERROR
```

**Solusi**: Periksa username dan password di file `.env`

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solusi**: Ubah PORT di file `.env` atau stop aplikasi yang menggunakan port tersebut

### CORS Error

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solusi**: Pastikan backend server sudah running dan CORS sudah dikonfigurasi dengan benar

## Database Structure

### Tables

- `users` - User accounts
- `accounts` - Wallet/bank accounts
- `transactions` - Financial transactions
- `categories` - Transaction categories
- `budgets` - Budget planning
- `debts` - Debt tracking
- `credits` - Recurring bills
- `notifications` - User notifications

## API Endpoints

### Authentication
- `GET /api/auth/users` - Get all saved users
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user
- `PUT /api/auth/users/:id` - Update user
- `DELETE /api/auth/users/:id` - Delete user

### Transactions
- `GET /api/transactions/:userId` - Get user transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Accounts
- `GET /api/accounts/:userId` - Get user accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `POST /api/accounts/transfer` - Transfer between accounts

### Notifications
- `GET /api/notifications/:userId` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all/:userId` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/clear-read/:userId` - Clear read notifications

### Categories
- `GET /api/categories/:userId` - Get categories
- `POST /api/categories` - Create category
- `DELETE /api/categories/:id` - Delete category

### Budgets
- `GET /api/budgets/:userId` - Get budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget

### Debts
- `GET /api/debts/:userId` - Get debts
- `POST /api/debts` - Create debt
- `POST /api/debts/:id/pay` - Pay debt

### Credits
- `GET /api/credits/:userId` - Get credits
- `POST /api/credits` - Create credit
- `POST /api/credits/:id/pay` - Pay credit
- `DELETE /api/credits/:id` - Delete credit

## Notes

- Data sekarang tersimpan di MySQL database, bukan localStorage
- Perlu menjalankan 2 server: backend (port 3001) dan frontend (port 5173)
- Pastikan MySQL service sudah running sebelum start backend server
