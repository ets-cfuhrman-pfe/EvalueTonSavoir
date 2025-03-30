import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminTable from "../../../components/AdminTable/AdminTable";
import { AdminTableType } from "../../../Types/AdminTableType";
import "@testing-library/jest-dom";

const mockData: AdminTableType[] = [
  { _id: "1", name: "John Doe", email: "john@example.com", created_at: new Date("2024-01-01"), roles: ["Admin"] },
  { _id: "2", name: "Jane Doe", email: "jane@example.com", created_at: new Date("2024-02-01"), roles: ["User"] },
  { _id: "3", name: "Alice Smith", email: "alice@example.com", created_at: new Date("2024-03-01"), roles: ["Editor"] },
];

const labelMap = {
  name: "Name",
  email: "Email",
  created_at: "Created At",
  roles: "Roles",
};

describe("AdminTable Component", () => {
  let mockOnDelete: jest.Mock;

  beforeEach(() => {
    mockOnDelete = jest.fn();
  });

  test("render AdminTable", () => {
    render(<AdminTable data={mockData} onDelete={mockOnDelete} labelMap={labelMap} />);
    
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Created At")).toBeInTheDocument();
    expect(screen.getByText("Roles")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  test("filters data based on search input", () => {
    render(<AdminTable data={mockData} onDelete={mockOnDelete} labelMap={labelMap} />);
    const searchInput = screen.getByPlaceholderText("Recherche: Enseignant, Courriel...");

    fireEvent.change(searchInput, { target: { value: "Alice" } });

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  test("opens and closes confirmation dialog", async () => {
    render(<AdminTable data={mockData} onDelete={mockOnDelete} labelMap={labelMap} />);
    const deleteButton = screen.getAllByRole("button")[0];
    
    fireEvent.click(deleteButton);
    expect(screen.getByText("Confirm Deletion")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText("Confirm Deletion")).not.toBeInTheDocument();
    });
  });

  test("onDelete when confirming delete", () => {
    render(<AdminTable data={mockData} onDelete={mockOnDelete} labelMap={labelMap} />);
    const deleteButton = screen.getAllByRole("button")[0];
    fireEvent.click(deleteButton);

    fireEvent.click(screen.getByText("Delete"));
    expect(mockOnDelete).toHaveBeenCalledWith(mockData[0]);
  });

  test("pagination buttons test click", () => {
    render(<AdminTable data={mockData} onDelete={mockOnDelete} labelMap={labelMap} />);
    
    const nextButton = screen.getByLabelText("Go to next page");
    fireEvent.click(nextButton);
    
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });
});
