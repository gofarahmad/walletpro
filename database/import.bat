@echo off
echo ========================================
echo WealthWise Database Import
echo ========================================
echo.

REM Cari MySQL di lokasi umum
set MYSQL_PATH=

if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
) else if exist "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe" (
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe
) else if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
) else if exist "C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe" (
    set MYSQL_PATH=C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe
) else (
    echo ERROR: MySQL tidak ditemukan!
    echo.
    echo Silakan install MySQL atau tambahkan ke PATH
    echo Atau edit file ini dan set MYSQL_PATH secara manual
    echo.
    pause
    exit /b 1
)

echo MySQL ditemukan di: %MYSQL_PATH%
echo.

echo [1/2] Importing schema.sql...
"%MYSQL_PATH%" -u root -h 127.0.0.1 -P 3306 < "d:\Finance\database\schema.sql"
if %errorlevel% neq 0 (
    echo ERROR: Gagal import schema!
    pause
    exit /b 1
)
echo Schema imported successfully!
echo.

echo [2/2] Importing seed.sql...
"%MYSQL_PATH%" -u root -h 127.0.0.1 -P 3306 < "d:\Finance\database\seed.sql"
if %errorlevel% neq 0 (
    echo ERROR: Gagal import seed data!
    pause
    exit /b 1
)
echo Seed data imported successfully!
echo.

echo ========================================
echo Database 'finance' berhasil dibuat!
echo ========================================
echo.
echo Default users:
echo - Phone: 081234567890, PIN: 1234 (Alex Rivera)
echo - Phone: 081234567891, PIN: 1234 (Maya Chen)
echo.
pause
