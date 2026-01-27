# Backend API Tests

This directory contains comprehensive tests for all backend REST API endpoints.

## Test Structure

```
tests/
├── setup.js                    # Global test setup (database connection, environment)
├── teardown.js                 # Global test cleanup
├── helpers/
│   ├── auth.js                 # Authentication helper functions
│   ├── database.js             # Database setup/teardown utilities
│   └── factories.js            # Test data factories
├── integration/
│   ├── accounts.test.js        # Account endpoint tests
│   ├── transactions.test.js    # Transaction endpoint tests
│   ├── auth.test.js            # Authentication tests
│   ├── users.test.js           # User endpoint tests
│   ├── atomicity.test.js       # MongoDB session atomicity tests
│   ├── response-formats.test.js # Response format consistency tests
│   ├── input-validation.test.js # Input validation tests
│   ├── error-handling.test.js  # Error handling tests
│   ├── categories.test.js      # Category endpoint tests
│   └── accountTypes.test.js    # Account type endpoint tests
└── README.md                   # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Database

Tests use `mongodb-memory-server` to create isolated in-memory MongoDB instances. Each test suite:
- Connects to a fresh in-memory database
- Clears all data before each test
- Closes the connection after all tests complete

## Test Coverage

Tests cover:
- All REST endpoints (GET, POST, PUT, DELETE)
- Authentication and authorization
- Input validation
- Error handling (400, 401, 403, 404, 500)
- Response format consistency
- MongoDB session atomicity
- Data integrity constraints

## Writing New Tests

### Example Test Structure

```javascript
import request from 'supertest';
import app from '../../app.js';
import { createTestUser } from '../helpers/auth.js';

describe('My Endpoint', () => {
  let user;

  beforeEach(async () => {
    user = await createTestUser();
  });

  const getAuthenticatedAgent = async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({
      email: user.email,
      password: 'password123',
    });
    return agent;
  };

  it('should do something', async () => {
    const agent = await getAuthenticatedAgent();
    const response = await agent.get('/api/my-endpoint');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });
});
```

### Test Helpers

- `createTestUser()` - Create a regular test user
- `createTestAdmin()` - Create an admin test user
- `createAccountFactory()` - Create a test account
- `createTransactionFactory()` - Create a test transaction
- `getAuthenticatedAgent()` - Get authenticated request agent

## Notes

- All tests run in isolation
- No external dependencies required (except MongoDB memory server)
- Tests are fast due to in-memory database
- Each test should be independent and not rely on other tests
