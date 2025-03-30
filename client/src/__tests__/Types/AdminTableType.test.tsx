import { AdminTableType } from "../../Types/AdminTableType";

it("AdminTableType allows valid data", () => {
  const validData: AdminTableType = {
    _id: "123",
    email: "user@example.com",
    created_at: new Date(),
    updated_at: new Date(),
    title: "Manager",
    name: "John Doe",
    roles: ["admin", "editor"],
  };

  expect(validData).toBeDefined();
  expect(validData._id).toBe("123");
  expect(validData.roles).toContain("admin");
});