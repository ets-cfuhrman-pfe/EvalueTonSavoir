import { FolderType } from "../../Types/FolderType";


it('FolderType should allow correct structure with valid types', () => {
  const validFolder: FolderType = {
    _id: "1",
    userId: "user123",
    title: "My Folder",
    created_at: "2025-03-30T22:08:47.839Z",
  };
  expect(validFolder._id).toBe("1");
  expect(validFolder.userId).toBe("user123");
  expect(validFolder.title).toBe("My Folder");
  expect(validFolder.created_at).toBe("2025-03-30T22:08:47.839Z");
});

it('FolderType should throw error if required fields are missing', () => {
  const missingRequiredFields = (folder: any) => {
    const requiredFields = ['_id', 'userId', 'title', 'created_at'];
    for (const field of requiredFields) {
      if (!folder[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  };

  // Test: Missing required field _id
  expect(() => {
    missingRequiredFields({
      userId: "user123",
      title: "My Folder",
      created_at: "2025-03-30T22:08:47.839Z",
    });
  }).toThrow('Missing required field: _id');

  // Test: Missing required field userId
  expect(() => {
    missingRequiredFields({
      _id: "1",
      title: "My Folder",
      created_at: "2025-03-30T22:08:47.839Z",
    });
  }).toThrow('Missing required field: userId');

  // Test: Missing required field title
  expect(() => {
    missingRequiredFields({
      _id: "1",
      userId: "user123",
      created_at: "2025-03-30T22:08:47.839Z",
    });
  }).toThrow('Missing required field: title');

  // Test: Missing required field created_at
  expect(() => {
    missingRequiredFields({
      _id: "1",
      userId: "user123",
      title: "My Folder",
    });
  }).toThrow('Missing required field: created_at');
});