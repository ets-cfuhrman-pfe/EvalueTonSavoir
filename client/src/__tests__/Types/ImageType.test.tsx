import {  ImageType, ImagesResponse, ImagesParams } from "../../Types/ImageType";

it("valid ImageType structure", () => {
  const validImage: ImageType = {
    id: "1",
    file_content: "mockBase64Content",
    file_name: "image.jpg",
    mime_type: "image/jpeg",
  };

  expect(validImage).toHaveProperty("id", "1");
  expect(validImage).toHaveProperty("file_content", "mockBase64Content");
  expect(validImage).toHaveProperty("file_name", "image.jpg");
  expect(validImage).toHaveProperty("mime_type", "image/jpeg");
});

it("invalid ImageType throws an error", () => {
  const invalidImage: any = {
    id: "1",
    file_content: "mockBase64Content",
    mime_type: "image/jpeg",
  };

  expect(() => {
    expect(invalidImage).toHaveProperty("file_name");
  }).toThrow();
});

it("valid ImagesResponse structure", () => {
  const validResponse: ImagesResponse = {
    images: [
      {
        id: "1",
        file_content: "mockBase64Content1",
        file_name: "image1.jpg",
        mime_type: "image/jpeg",
      },
      {
        id: "2",
        file_content: "mockBase64Content2",
        file_name: "image2.jpg",
        mime_type: "image/jpeg",
      },
    ],
    total: 2,
  };

  expect(validResponse).toHaveProperty("images");
  expect(validResponse.images).toBeInstanceOf(Array);
  expect(validResponse.images[0]).toHaveProperty("id");
  expect(validResponse.images[0]).toHaveProperty("file_content");
  expect(validResponse.images[0]).toHaveProperty("file_name");
  expect(validResponse.images[0]).toHaveProperty("mime_type");
  expect(validResponse).toHaveProperty("total", 2);
});

it("invalid ImagesResponse structure", () => {
  const invalidResponse: any = { total: 2};
  expect(invalidResponse.images).toBeUndefined();
});

it("valid ImagesParams structure", () => {
  const validParams: ImagesParams = {
    page: 1,
    limit: 10,
    uid: "user123",
  };
  expect(validParams).toHaveProperty("page", 1);
  expect(validParams).toHaveProperty("limit", 10);
  expect(validParams).toHaveProperty("uid", "user123");
});

it("invalid ImagesParams structure", () => {
  const invalidParams: any = { page: 1};

  expect(() => {
    expect(invalidParams).toHaveProperty("limit");
  }).toThrow();
});