import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import accountRoutes from './routes/accounts.js';
import notificationRoutes from './routes/notifications.js';
import categoryRoutes from './routes/categories.js';
import budgetRoutes from './routes/budgets.js';
import debtRoutes from './routes/debts.js';
import creditRoutes from './routes/credits.js';
import billRoutes from './routes/bills.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Support both Vite ports
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/bills', billRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'PayFin API is running' });
});

// Root Route
app.get('/', (req, res) => {
    res.json({ message: 'PayFin API Server is Running! 🚀' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
