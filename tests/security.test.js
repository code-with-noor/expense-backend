import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from '../routes/authRoutes.js';
import transactionRoutes from '../routes/transactionRoutes.js';
import accountRoutes from '../routes/accountRoutes.js';
import budgetRoutes from '../routes/budgetRoutes.js';
import analyticsRoutes from '../routes/analyticsRoutes.js';
import savingsGoalRoutes from '../routes/savingsGoalRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/savings-goals', savingsGoalRoutes);

let server;
let baseUrl;

before(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_12345';
  const mongoUri = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/expense_tracker_test';
  
  try {
    await mongoose.connect(mongoUri);
    // Clear test collections
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  } catch (err) {
    console.warn('MongoDB connection fallback to memory/mock for test if offline:', err.message);
  }

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

const req = async (path, options = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

describe('MERN Security & Data Isolation Audit Test Suite', () => {
  let userAToken, userBToken;
  let userATransactionId, userAAccountId, userAGoalId;

  it('1. Rejects unauthenticated API requests with 401 Unauthorized', async () => {
    const res = await req('/api/transactions');
    assert.equal(res.status, 401);
  });

  it('2. Registers User A and verifies brand new account starts with zero stats', async () => {
    const regRes = await req('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'User A',
        email: 'userA@example.com',
        password: 'password123',
      }),
    });
    assert.equal(regRes.status, 201);
    assert.ok(regRes.data.token);
    userAToken = regRes.data.token;

    // Check summary for fresh user A
    const summaryRes = await req('/api/transactions/analytics/summary', {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.equal(summaryRes.status, 200);
    assert.equal(summaryRes.data.totalBalance, 0);
    assert.equal(summaryRes.data.totalIncome, 0);
    assert.equal(summaryRes.data.totalExpenses, 0);
    assert.equal(summaryRes.data.monthlyBudget, 0);

    // Check accounts list for fresh user A
    const accRes = await req('/api/accounts', {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.equal(accRes.status, 200);
    assert.equal(accRes.data.length, 0);

    // Check transactions list for fresh user A
    const txRes = await req('/api/transactions', {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.equal(txRes.status, 200);
    assert.equal(txRes.data.transactions.length, 0);
  });

  it('3. Creates data for User A (Transaction, Account, Savings Goal)', async () => {
    // Create Account for User A
    const accRes = await req('/api/accounts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ name: 'Account A', type: 'bank', balance: 5000 }),
    });
    assert.equal(accRes.status, 201);
    userAAccountId = accRes.data._id || accRes.data.id;

    // Create Transaction for User A
    const txRes = await req('/api/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        amount: 1000,
        category: 'Salary',
        type: 'income',
        note: 'Income A',
      }),
    });
    assert.equal(txRes.status, 201);
    userATransactionId = txRes.data._id || txRes.data.id;

    // Create Savings Goal for User A
    const goalRes = await req('/api/savings-goals', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        name: 'Goal A',
        targetAmount: 10000,
        currentAmount: 1000,
        targetDate: '2026-12-31',
      }),
    });
    assert.equal(goalRes.status, 201);
    userAGoalId = goalRes.data._id || goalRes.data.id;
  });

  it('4. Registers User B and verifies User B sees 0 data (isolated from User A)', async () => {
    const regRes = await req('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'User B',
        email: 'userB@example.com',
        password: 'password123',
      }),
    });
    assert.equal(regRes.status, 201);
    userBToken = regRes.data.token;

    // Verify User B summary is completely 0
    const summaryRes = await req('/api/transactions/analytics/summary', {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert.equal(summaryRes.status, 200);
    assert.equal(summaryRes.data.totalBalance, 0);
    assert.equal(summaryRes.data.totalIncome, 0);
    assert.equal(summaryRes.data.totalExpenses, 0);

    // Verify User B transaction list does NOT contain User A transactions
    const txRes = await req('/api/transactions', {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert.equal(txRes.status, 200);
    assert.equal(txRes.data.transactions.length, 0);
  });

  it('5. User B Attack: Prevents User B from accessing User A transaction (GET)', async () => {
    const res = await req(`/api/transactions/${userATransactionId}`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert.ok(res.status === 403 || res.status === 404);
  });

  it('6. User B Attack: Prevents User B from updating User A transaction (PUT)', async () => {
    const res = await req(`/api/transactions/${userATransactionId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userBToken}` },
      body: JSON.stringify({ amount: 9999 }),
    });
    assert.ok(res.status === 403 || res.status === 404);
  });

  it('7. User B Attack: Prevents User B from deleting User A transaction (DELETE)', async () => {
    const res = await req(`/api/transactions/${userATransactionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert.ok(res.status === 403 || res.status === 404);
  });

  it('8. User B Attack: Prevents User B from deleting User A account (DELETE)', async () => {
    const res = await req(`/api/accounts/${userAAccountId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert.ok(res.status === 403 || res.status === 404);
  });

  it('9. User B Attack: Prevents User B from deleting User A savings goal (DELETE)', async () => {
    const res = await req(`/api/savings-goals/${userAGoalId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert.ok(res.status === 403 || res.status === 404);
  });
});
