import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Footer } from "@/components/Footer";


describe("Footer component", () => {
  it("renders correctly with footer text", () => {
    render(<Footer />);
    expect(screen.getByText(/JORDAN KATZ/i)).toBeInTheDocument();
  });
});
