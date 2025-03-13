import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImageDialog from "../../../components/ImageGallery/ImageGallery";
import ApiService from "../../../services/ApiService";
import { Images } from "../../../Types/Images";
import { act } from "react";
import "@testing-library/jest-dom";

// Mock ApiService
jest.mock("../../../services/ApiService");

const mockImages: Images[] = [
  { id: "1", file_name: "image1.jpg", mime_type: "image/jpeg", file_content: "mockBase64Content1" },
  { id: "2", file_name: "image2.jpg", mime_type: "image/jpeg", file_content: "mockBase64Content2" },
  { id: "3", file_name: "image3.jpg", mime_type: "image/jpeg", file_content: "mockBase64Content3" },
];

describe("ImageDialog Component", () => {
    let setDialogOpenMock: jest.Mock;
    let setImageLinksMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setDialogOpenMock = jest.fn();
    setImageLinksMock = jest.fn();
    jest.spyOn(ApiService, "getImages").mockResolvedValue({ images: mockImages, total: 6 });
  });

  test("renders the dialog when open", async () => {

    await act(async () => {
        render(
          <ImageDialog
            galleryOpen={true}
            setDialogOpen={setDialogOpenMock}
            setImageLinks={setImageLinksMock}
          />
        );
      });

    expect(screen.getByText("Images disponibles")).toBeInTheDocument();
    await waitFor(() => expect(ApiService.getImages).toHaveBeenCalledWith(1, 3));
    expect(screen.getAllByRole("img")).toHaveLength(mockImages.length);
  });

  test("closes the dialog when close button is clicked", async () => {

    await act(async () => {
        render(
          <ImageDialog
            galleryOpen={true}
            setDialogOpen={setDialogOpenMock}
            setImageLinks={setImageLinksMock}
          />
        );
      });

    fireEvent.click(screen.getByLabelText("close"));
    expect(setDialogOpenMock).toHaveBeenCalledWith(false);
  });

  test("copies the image link when copy button is clicked", async () => {

    //const setImageLinksMock = jest.fn();
    await act(async () => {
        render(
          <ImageDialog
            galleryOpen={true}
            setDialogOpen={setDialogOpenMock}
            setImageLinks={setImageLinksMock}
          />
        );
      });

    await act(async () => {
        await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(mockImages.length));
    });
  
    // Click the copy button
    fireEvent.click(screen.getByTestId("copy-button-1")); 
    // Check that "Copié!" appears
    expect(screen.getByText("Copié!")).toBeInTheDocument();
  });

  test("navigates to next and previous page", async () => {
    await act(async () => {
        render(
          <ImageDialog
            galleryOpen={true}
            setDialogOpen={setDialogOpenMock}
            setImageLinks={setImageLinksMock}
          />
        );
      });

    await waitFor(() => expect(ApiService.getImages).toHaveBeenCalledWith(1, 3));

    fireEvent.click(screen.getByText("Suivant"));

    await waitFor(() => expect(ApiService.getImages).toHaveBeenCalledWith(2, 3));

    fireEvent.click(screen.getByText("Précédent"));

    await waitFor(() => expect(ApiService.getImages).toHaveBeenCalledWith(1, 3));
  });

  test("deletes an image successfully", async () => {
    jest.spyOn(ApiService, "deleteImage").mockResolvedValue(true);
    
    await act(async () => {
      render(
        <ImageDialog
          galleryOpen={true}
          setDialogOpen={setDialogOpenMock}
          setImageLinks={setImageLinksMock}
        />
      );
    });

    await waitFor(() => expect(ApiService.getImages).toHaveBeenCalled());
    
    fireEvent.click(screen.getByTestId("delete-button-1"));
    
    await waitFor(() => expect(ApiService.deleteImage).toHaveBeenCalledWith("1"));
    
    expect(screen.queryByTestId("delete-button-1")).not.toBeInTheDocument();
  });

  test("handles failed delete when image is linked", async () => {
    jest.spyOn(ApiService, "deleteImage").mockResolvedValue(false);
    
    await act(async () => {
      render(
        <ImageDialog
          galleryOpen={true}
          setDialogOpen={setDialogOpenMock}
          setImageLinks={setImageLinksMock}
        />
      );
    });

    await waitFor(() => expect(ApiService.getImages).toHaveBeenCalled());
    
    fireEvent.click(screen.getByTestId("delete-button-1"));
    
    await waitFor(() => expect(ApiService.deleteImage).toHaveBeenCalledWith("1"));
    
    expect(screen.getByText("Confirmer la suppression")).toBeInTheDocument();
  });
});