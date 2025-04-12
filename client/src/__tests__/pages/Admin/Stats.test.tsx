import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import Stats from "../../../pages/Admin/Stats";
import ApiService from '../../../services/ApiService';
import '@testing-library/jest-dom';

jest.mock('../../../services/ApiService', () => ({
  getStats: jest.fn(),
}));

describe("Stats Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ApiService.getStats as jest.Mock).mockReset();
  });

  test("renders loading state initially", async () => {
    (ApiService.getStats as jest.Mock).mockImplementationOnce(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              quizzes: [],
              total: 0,
            });
          }, 100);
        })
      );

    await act(async () => {
      render(<Stats />);
    });

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("fetches and displays data", async () => {
    const mockStats = {
      quizzes: [{ _id: "1", title: "Mock Quiz", created_at: "2025-03-01", updated_at: "2025-03-05", email: "teacher@example.com" }],
      total: 5,
    };

    (ApiService.getStats as jest.Mock).mockResolvedValueOnce(mockStats);


    await act(async () => {
        render(<Stats />);
    });

    await waitFor(() => screen.queryByRole("progressbar"));

    expect(screen.getByText("Quiz du Mois")).toBeInTheDocument();
    expect(screen.getByText(mockStats.quizzes.length)).toBeInTheDocument();
    expect(screen.getByText("Quiz total")).toBeInTheDocument();
    expect(screen.getByText(mockStats.quizzes.length)).toBeInTheDocument();
    expect(screen.getByText("Enseignants")).toBeInTheDocument();
    expect(screen.getByText(mockStats.total)).toBeInTheDocument();
  });

  test("should display the AdminTable mock component", async () => {
    const mockStats = {
      quizzes: [{ _id: "1", title: "Mock Quiz", created_at: "2025-03-01", updated_at: "2025-03-05", email: "teacher@example.com" }],
      total: 5,
    };

    (ApiService.getStats as jest.Mock).mockResolvedValueOnce(mockStats);


    await act(async () => {
        render(<Stats />);
    });

    expect(screen.getByRole('columnheader', { name: /enseignant/i })).toBeInTheDocument();

  });
});
