import React, { act } from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImageGallery from "../../../components/ImageGallery/ImageGallery";
import ApiService from "../../../services/ApiService";
import { Images } from "../../../Types/Images";
import userEvent from "@testing-library/user-event";

jest.mock("../../../services/ApiService");

const mockImages: Images[] = [
  { id: "1", file_name: "image1.jpg", mime_type: "image/jpeg", file_content: "mockBase64Content1" },
  { id: "2", file_name: "image2.jpg", mime_type: "image/jpeg", file_content: "mockBase64Content2" },
  { id: "3", file_name: "image3.jpg", mime_type: "image/jpeg", file_content: "mockBase64Content3" },
];

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'mockedObjectUrl');
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn(),
    },
  });
});

describe("ImageGallery", () => {
  let mockHandleDelete: jest.Mock;
  
  beforeEach(async () => {
    (ApiService.getUserImages as jest.Mock).mockResolvedValue({ images: mockImages, total: 3 });
    (ApiService.deleteImage as jest.Mock).mockResolvedValue(true); 
    (ApiService.uploadImage as jest.Mock).mockResolvedValue('mockImageUrl'); 
    await act(async () => {
      render(<ImageGallery />);
    });
    mockHandleDelete = jest.fn();
  });

  it("should render images correctly", async () => {
    await act(async () => {
      await screen.findByText("Galerie");
    });

    expect(screen.getByAltText("Image image1.jpg")).toBeInTheDocument();
    expect(screen.getByAltText("Image image2.jpg")).toBeInTheDocument();
  });

  it("should handle copy action", async () => {
    const handleCopyMock = jest.fn();
    await act(async () => {
      render(<ImageGallery handleCopy={handleCopyMock} />);
    });

    const copyButtons = await waitFor(() => screen.findAllByTestId(/gallery-tab-copy-/));
    await act(async () => {
      fireEvent.click(copyButtons[0]);
    });
  
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it("should delete an image and update the gallery", async () => {
    const fetchImagesMock = jest.fn().mockResolvedValue({ images: mockImages.filter((image) => image.id !== "1"), total: 2 });

    (ApiService.getUserImages as jest.Mock).mockImplementation(fetchImagesMock);

    await act(async () => {
      render(<ImageGallery handleDelete={mockHandleDelete} />);
    });

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
      expect(screen.getByText("Image supprimée avec succès!")).toBeInTheDocument();
    });
  });

  it("should upload an image and display success message", async () => {
    const importTab = screen.getByRole("tab", { name: /import/i });
    fireEvent.click(importTab);

    const fileInputs = await screen.findAllByTestId("file-input");
    const fileInput = fileInputs[1];

    expect(fileInput).toBeInTheDocument();
  
    const file = new File(["image"], "image.jpg", { type: "image/jpeg" });
    await userEvent.upload(fileInput, file);
  

    await waitFor(() => screen.getByAltText("Preview"));
    const previewImage = screen.getByAltText("Preview");
  
    expect(previewImage).toBeInTheDocument();
    
    const uploadButton = screen.getByRole('button', { name: /téléverser/i });
    fireEvent.click(uploadButton);
    const successMessage = await screen.findByText(/téléversée avec succès/i);
    expect(successMessage).toBeInTheDocument();
  });

  it("should close the image preview dialog when close button is clicked", async () => {
    const imageCard = screen.getByAltText("Image image1.jpg");
    fireEvent.click(imageCard);
    
    const dialogImage = await screen.findByAltText("Enlarged view");
    expect(dialogImage).toBeInTheDocument();
    
    const closeButton = screen.getByTestId("close-button");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByAltText("Enlarged view")).not.toBeInTheDocument();
    });
  });
  
  it("should show an error message when no file is selected", async () => {
    const importTab = screen.getByRole("tab", { name: /import/i });
    fireEvent.click(importTab);
    const uploadButton = screen.getByRole('button', { name: /téléverser/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText("Veuillez choisir une image à téléverser.")).toBeInTheDocument();
    });
  });

});
