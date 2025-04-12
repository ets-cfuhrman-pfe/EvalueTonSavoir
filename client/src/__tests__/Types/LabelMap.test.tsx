import { LabelMap } from "../../Types/LabelMap";

it("LabelMap should only allow string keys and string values", () => {
  // Valid LabelMap example with different keys
  const validLabelMap: LabelMap = {
    name: "Name",
    email: "Email",
    created_at: "Created At",
  };

  expect(validLabelMap).toBeDefined();
  expect(Object.keys(validLabelMap)).toEqual(["name", "email", "created_at"]);
  expect(validLabelMap.name).toBe("Name");
  expect(validLabelMap.email).toBe("Email");
  expect(validLabelMap.created_at).toBe("Created At");
});

it("LabelMap should allow only specified keys", () => {
  const validLabelMap: LabelMap = {
    name: "Name",
    email: "Email",
    created_at: "Created At",
  };
  
  const knownKeys = ["name", "email", "created_at"];
  const keys = Object.keys(validLabelMap);
  knownKeys.forEach((key) => {
    expect(keys).toContain(key);
    expect(typeof validLabelMap[key]).toBe("string");
  });
  
  Object.values(validLabelMap).forEach((value) => {
    expect(typeof value).toBe("string");
  });
});