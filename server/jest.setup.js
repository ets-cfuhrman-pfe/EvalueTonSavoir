// This file sets up Jest's environment before tests run

require('dotenv').config();

// Removed global db mock to allow integration tests to use real db
// jest.mock('./config/db');

// After all tests complete
afterAll(async () => {
  // Allow time for any async operations to complete
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Tests completed, cleaned up resources');
});
