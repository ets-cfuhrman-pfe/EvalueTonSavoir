import { UserType, UsersResponse } from "../../Types/UserType";

it("valid UserType structure", () => {
  const validUser: UserType = {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    created_at: new Date().toISOString(),
    roles: ["admin", "user"],
  };
  expect(validUser).toHaveProperty("id", "1");
  expect(validUser).toHaveProperty("name", "John Doe");
  expect(validUser).toHaveProperty("email", "john.doe@example.com");
  expect(validUser).toHaveProperty("created_at");
  expect(validUser).toHaveProperty("roles");
  expect(validUser.roles).toBeInstanceOf(Array);
  expect(validUser.roles).toContain("admin");
  expect(validUser.roles).toContain("user");
});

it("valid UsersResponse structure", () => {
  const validResponse: UsersResponse = {
    users: [
      {
        id: "1",
        name: "John Doe",
        email: "john.doe@example.com",
        created_at: new Date().toISOString(),
        roles: ["admin"],
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        created_at: new Date().toISOString(),
        roles: ["user"],
      },
    ],
  };
  expect(validResponse).toHaveProperty("users");
  expect(validResponse.users).toBeInstanceOf(Array);
  expect(validResponse.users[0]).toHaveProperty("id");
  expect(validResponse.users[0]).toHaveProperty("name");
  expect(validResponse.users[0]).toHaveProperty("email");
  expect(validResponse.users[0]).toHaveProperty("roles");
});

it("invalid UsersResponse structure", () => {
  const invalidResponse: any = { };
  expect(invalidResponse.users).toBeUndefined();
});
