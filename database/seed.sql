-- WealthWise Finance Seed Data
USE finance;

-- Insert Default Users
INSERT INTO users (id, name, phone_number, pin, photo_url, is_saved) VALUES
('user_alex', 'Alex Rivera', '081234567890', '$2b$10$rZ8qNqZ5qZ5qZ5qZ5qZ5qOqZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5q', 'https://picsum.photos/seed/alex/100', TRUE),
('user_maya', 'Maya Chen', '081234567891', '$2b$10$rZ8qNqZ5qZ5qZ5qZ5qZ5qOqZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5q', 'https://picsum.photos/seed/maya/100', TRUE);

-- Note: PIN hash above is for '1234' - in production, use proper bcrypt hashing

-- Insert Default Categories for Alex
INSERT INTO categories (id, user_id, name, icon, type, is_default) VALUES
-- Income Categories
('cat_salary_alex', 'user_alex', 'Gaji', 'payments', 'Income', TRUE),
('cat_freelance_alex', 'user_alex', 'Freelance', 'work', 'Income', TRUE),
('cat_investment_alex', 'user_alex', 'Investasi', 'trending_up', 'Income', TRUE),
('cat_other_income_alex', 'user_alex', 'Lainnya', 'more_horiz', 'Income', TRUE),

-- Expense Categories
('cat_food_alex', 'user_alex', 'Makanan', 'restaurant', 'Expense', TRUE),
('cat_transport_alex', 'user_alex', 'Transportasi', 'directions_car', 'Expense', TRUE),
('cat_shopping_alex', 'user_alex', 'Belanja', 'shopping_bag', 'Expense', TRUE),
('cat_bills_alex', 'user_alex', 'Tagihan', 'receipt_long', 'Expense', TRUE),
('cat_health_alex', 'user_alex', 'Kesehatan', 'medical_services', 'Expense', TRUE),
('cat_entertainment_alex', 'user_alex', 'Hiburan', 'movie', 'Expense', TRUE),
('cat_other_expense_alex', 'user_alex', 'Lainnya', 'more_horiz', 'Expense', TRUE);

-- Insert Default Categories for Maya
INSERT INTO categories (id, user_id, name, icon, type, is_default) VALUES
-- Income Categories
('cat_salary_maya', 'user_maya', 'Gaji', 'payments', 'Income', TRUE),
('cat_freelance_maya', 'user_maya', 'Freelance', 'work', 'Income', TRUE),
('cat_investment_maya', 'user_maya', 'Investasi', 'trending_up', 'Income', TRUE),
('cat_other_income_maya', 'user_maya', 'Lainnya', 'more_horiz', 'Income', TRUE),

-- Expense Categories
('cat_food_maya', 'user_maya', 'Makanan', 'restaurant', 'Expense', TRUE),
('cat_transport_maya', 'user_maya', 'Transportasi', 'directions_car', 'Expense', TRUE),
('cat_shopping_maya', 'user_maya', 'Belanja', 'shopping_bag', 'Expense', TRUE),
('cat_bills_maya', 'user_maya', 'Tagihan', 'receipt_long', 'Expense', TRUE),
('cat_health_maya', 'user_maya', 'Kesehatan', 'medical_services', 'Expense', TRUE),
('cat_entertainment_maya', 'user_maya', 'Hiburan', 'movie', 'Expense', TRUE),
('cat_other_expense_maya', 'user_maya', 'Lainnya', 'more_horiz', 'Expense', TRUE);

-- Insert Sample Accounts for Alex
INSERT INTO accounts (id, user_id, name, balance, icon) VALUES
('acc_cash_alex', 'user_alex', 'Tunai', 5000000.00, 'account_balance_wallet'),
('acc_bca_alex', 'user_alex', 'BCA', 15000000.00, 'account_balance'),
('acc_gopay_alex', 'user_alex', 'GoPay', 500000.00, 'phone_android');

-- Insert Sample Accounts for Maya
INSERT INTO accounts (id, user_id, name, balance, icon) VALUES
('acc_cash_maya', 'user_maya', 'Tunai', 3000000.00, 'account_balance_wallet'),
('acc_mandiri_maya', 'user_maya', 'Mandiri', 10000000.00, 'account_balance');

-- Insert Sample Transactions for Alex (last 30 days)
INSERT INTO transactions (id, user_id, account_id, amount, type, category, note, date) VALUES
('tx_1_alex', 'user_alex', 'acc_bca_alex', 8000000.00, 'Income', 'Gaji', 'Gaji Januari', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('tx_2_alex', 'user_alex', 'acc_cash_alex', 150000.00, 'Expense', 'Makanan', 'Makan siang', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('tx_3_alex', 'user_alex', 'acc_gopay_alex', 50000.00, 'Expense', 'Transportasi', 'Grab ke kantor', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('tx_4_alex', 'user_alex', 'acc_cash_alex', 300000.00, 'Expense', 'Belanja', 'Groceries', NOW());

-- Insert Sample Budgets for Alex
INSERT INTO budgets (id, user_id, category, limit_amount, spent, icon) VALUES
('budget_food_alex', 'user_alex', 'Makanan', 2000000.00, 450000.00, 'restaurant'),
('budget_transport_alex', 'user_alex', 'Transportasi', 1000000.00, 250000.00, 'directions_car'),
('budget_entertainment_alex', 'user_alex', 'Hiburan', 500000.00, 100000.00, 'movie');

-- Insert Sample Debts for Alex
INSERT INTO debts (id, user_id, name, amount, paid, due_date) VALUES
('debt_1_alex', 'user_alex', 'Pinjaman Teman', 1000000.00, 500000.00, DATE_ADD(NOW(), INTERVAL 15 DAY)),
('debt_2_alex', 'user_alex', 'Hutang Keluarga', 2000000.00, 0.00, DATE_ADD(NOW(), INTERVAL 30 DAY));

-- Insert Sample Credits for Alex
INSERT INTO credits (id, user_id, name, amount, due_date, is_paid_this_month) VALUES
('credit_1_alex', 'user_alex', 'Indihome', 350000.00, 25, FALSE),
('credit_2_alex', 'user_alex', 'Listrik PLN', 500000.00, 20, FALSE),
('credit_3_alex', 'user_alex', 'BPJS Kesehatan', 150000.00, 10, TRUE);

-- Insert Sample Bills for Alex
INSERT INTO bills (id, user_id, name, amount, due_date, is_paid_this_month, category) VALUES
('bill_1_alex', 'user_alex', 'Internet Indihome', 350000.00, 25, FALSE, 'Tagihan'),
('bill_2_alex', 'user_alex', 'Listrik PLN', 500000.00, 20, FALSE, 'Tagihan'),
('bill_3_alex', 'user_alex', 'Air PDAM', 150000.00, 15, TRUE, 'Tagihan'),
('bill_4_alex', 'user_alex', 'Netflix', 186000.00, 5, FALSE, 'Hiburan');

-- Insert Sample Notifications for Alex
INSERT INTO notifications (id, user_id, title, message, type, is_read, date) VALUES
('notif_1_alex', 'user_alex', 'Transaksi Dicatat', 'Pengeluaran Rp 300.000 untuk Belanja berhasil dicatat', 'Success', FALSE, NOW()),
('notif_2_alex', 'user_alex', 'Tagihan Jatuh Tempo', 'Indihome Rp 350.000 jatuh tempo tanggal 25', 'Warning', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('notif_3_alex', 'user_alex', 'Budget Alert', 'Pengeluaran Makanan sudah mencapai 22% dari budget', 'Info', TRUE, DATE_SUB(NOW(), INTERVAL 3 DAY));
