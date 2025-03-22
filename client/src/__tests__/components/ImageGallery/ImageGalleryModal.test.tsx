import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImageGalleryModal from "../../../components/ImageGallery/ImageGalleryModal/ImageGalleryModal";
import "@testing-library/jest-dom";

jest.mock("../../../components/ImageGallery/ImageGallery", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="image-gallery" />),
}));

describe("ImageGalleryModal", () => {

  it("renders button correctly", () => {
    render(<ImageGalleryModal />);

    const button = screen.getByLabelText(/images-open/i);
    expect(button).toBeInTheDocument();
  });

  it("opens the modal when button is clicked", () => {
    render(<ImageGalleryModal />);
    
    const button = screen.getByRole("button", { name: /images/i });
    fireEvent.click(button);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });


  it("closes the modal when close button is clicked", async () => {
    render(<ImageGalleryModal />);
    
    fireEvent.click(screen.getByRole("button", { name: /images/i }));
    
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    
    await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

});
