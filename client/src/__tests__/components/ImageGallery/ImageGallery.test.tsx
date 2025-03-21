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

  let mockHandleDelete: jest.Mock;
  beforeEach(() => {
    (ApiService.getUserImages as jest.Mock).mockResolvedValue({ images: mockImages, total: 3 });
    (ApiService.deleteImage as jest.Mock).mockResolvedValue(true); 
    (ApiService.uploadImage as jest.Mock).mockResolvedValue('mockImageUrl'); 
    mockHandleDelete = jest.fn();

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

  it("should delete an image and update the gallery", async () => {
    const fetchImagesMock = jest.fn().mockResolvedValue({ images: mockImages.filter((image) => image.id !== "1"), total: 2 });

    (ApiService.getUserImages as jest.Mock).mockImplementation(fetchImagesMock);

    render(<ImageGallery handleDelete={mockHandleDelete} />);

    await act(async () => {
      await screen.findByAltText("Image image1.jpg");
    });

    const deleteButtons = await waitFor(() => screen.findAllByTestId(/gallery-tab-delete-/));
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText("Voulez-vous supprimer cette image?")).toBeInTheDocument();
    });

    const confirmDeleteButton = screen.getByText("Delete");  
    await act(async () => {
      fireEvent.click(confirmDeleteButton);
    });

    await waitFor(() => {
      expect(ApiService.deleteImage).toHaveBeenCalledWith("1");
    });

    await waitFor(() => {
      expect(screen.queryByAltText("Image image1.jpg")).toBeNull();
      expect(screen.getByText("Image supprimée avec succès !")).toBeInTheDocument();
    });
  });

});
