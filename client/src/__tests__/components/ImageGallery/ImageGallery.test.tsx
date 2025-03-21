import React, { act } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImageGallery from "../../../components/ImageGallery/ImageGallery";
import ApiService from "../../../services/ApiService";
import { Images } from "../../../Types/Images";
import "@testing-library/jest-dom";

jest.mock("../../../services/ApiService");

const mockImages: Images[] = [
  { id: "1", file_name: "image1.jpg", mime_type: "image/jpeg", file_content: "mockBase64Content1" },
  { id: "2", file_name: "image2.jpg", mime_type: "image/jpeg", file_content: "mockBase64Content2" },
  { id: "3", file_name: "image3.jpg", mime_type: "image/jpeg", file_content: "mockBase64Content3" },
];

beforeAll(() => {
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn(),
    },
  });
});

describe("ImageGallery", () => {
  beforeEach(() => {
    (ApiService.getUserImages as jest.Mock).mockResolvedValue({ images: mockImages, total: 3 });
    (ApiService.deleteImage as jest.Mock).mockResolvedValue(true); 
    (ApiService.uploadImage as jest.Mock).mockResolvedValue('mockImageUrl'); 

    render(<ImageGallery />);
  });

  it("should render images correctly", async () => {
    await act(async () => {
      await screen.findByText("Gallery");
    });

    expect(screen.getByAltText("Image image1.jpg")).toBeInTheDocument();
    expect(screen.getByAltText("Image image2.jpg")).toBeInTheDocument();
  });

  it("should handle copy action", async () => {
    const handleCopyMock = jest.fn();
  
    render(<ImageGallery handleCopy={handleCopyMock} />);
  
  const copyButtons = await waitFor(() => screen.findAllByTestId(/gallery-tab-copy-/));
  await act(async () => {
    fireEvent.click(copyButtons[0]);
  });
  
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

});