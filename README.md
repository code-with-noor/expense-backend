**API Endpoints**

| Method | Endpoint | Auth | Request Body | Description |
| ------ | -------- | ---- | ------------ | ----------- |
| POST | /api/auth/signup | No | { name, email, password } | Register a new user; returns user and token |
| POST | /api/auth/login | No | { email, password } | Authenticate user; returns user and token |
| POST | /api/transactions | Yes (Bearer token) | { amount, category, type } | Create a transaction (`type`: "income" or "expense") |
| GET  | /api/transactions | Yes (Bearer token) | n/a | Get all transactions for the authenticated user |

**Notes**
- Include header `Authorization: Bearer <token>` for protected routes.
- `amount` should be a number; `category` a string; `type` either `income` or `expense`.

Example cURL for creating a transaction:

```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"amount":100,"category":"Salary","type":"income"}'
```
