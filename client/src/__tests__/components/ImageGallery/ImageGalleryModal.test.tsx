import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImageGalleryModalV2 from "../../../components/ImageGallery/ImageGalleryModal/ImageGalleryModalV2";
import "@testing-library/jest-dom";

jest.mock("../../../components/ImageGallery/ImageGallery", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="image-gallery" />),
}));

describe("ImageGalleryModalV2", () => {

  it("renders button correctly", () => {
    render(<ImageGalleryModalV2 />);

    const button = screen.getByLabelText(/images-open/i);
    expect(button).toBeInTheDocument();
  });

  it("opens the modal when button is clicked", () => {
    render(<ImageGalleryModalV2 />);
    
    const button = screen.getByRole("button", { name: /images/i });
    fireEvent.click(button);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });


  it("closes the modal when close button is clicked", async () => {
    render(<ImageGalleryModalV2 />);
    
    fireEvent.click(screen.getByRole("button", { name: /images/i }));
    
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    
    await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

});
