# Manual Import Instructions

Jika batch file tidak berfungsi, import manual dengan cara:

## Option 1: MySQL Command Line

```bash
# Buka Command Prompt atau PowerShell
# Navigate ke folder MySQL bin (contoh):
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Import schema
mysql -u root -h 127.0.0.1 -P 3306 < "d:\Finance\database\schema.sql"

# Import seed data
mysql -u root -h 127.0.0.1 -P 3306 < "d:\Finance\database\seed.sql"
```

## Option 2: MySQL Workbench

1. Buka MySQL Workbench
2. Connect ke server (127.0.0.1:3306, user: root, no password)
3. File → Run SQL Script
4. Pilih `d:\Finance\database\schema.sql`
5. Execute
6. File → Run SQL Script
7. Pilih `d:\Finance\database\seed.sql`
8. Execute

## Option 3: phpMyAdmin (jika pakai XAMPP/WAMP)

1. Buka http://localhost/phpmyadmin
2. Klik "Import" tab
3. Choose file: `d:\Finance\database\schema.sql`
4. Click "Go"
5. Ulangi untuk `seed.sql`

## Verify Import

```sql
USE finance;
SHOW TABLES;
SELECT * FROM users;
```

Seharusnya ada 8 tables dan 2 users (Alex Rivera & Maya Chen).
