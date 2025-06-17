// This file sets up Jest's environment before tests run

// Tell Jest to use our mock for the database
jest.mock('./config/db');

// After all tests complete
afterAll(async () => {
  // Allow time for any async operations to complete
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Tests completed, cleaned up resources');
});
