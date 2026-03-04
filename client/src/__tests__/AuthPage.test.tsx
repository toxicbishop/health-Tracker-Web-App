import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import AuthPage from "../pages/AuthPage";

// Mock the auth API
vi.mock("../api/health", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
  },
}));

function renderAuthPage() {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AuthPage />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>,
  );
}

describe("AuthPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders default login form", () => {
    renderAuthPage();
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("shows error when submitting empty fields", async () => {
    renderAuthPage();
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));
    await waitFor(() => {
      expect(screen.getByText("Please fill in all fields.")).toBeInTheDocument();
    });
  });

  it("switches to register mode when clicking Sign up", async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText("Sign up"));
    expect(screen.getByText("Create account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument();
  });

  it("shows confirm password field in register mode", async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText("Sign up"));
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });

  it("shows error when passwords do not match on register", async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText("Sign up"));

    await userEvent.type(screen.getByLabelText(/^Username/i), "testuser");
    await userEvent.type(screen.getByLabelText(/^Password/i), "password123");
    await userEvent.type(screen.getByLabelText(/^Confirm Password/i), "different");

    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));
    await waitFor(() => {
      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    });
  });

  it("switches to forgot password mode", async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText("Forgot password?"));
    expect(screen.getByText("Reset password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send Reset Instructions/i })).toBeInTheDocument();
  });

  it("shows back button in forgot mode and returns to login", async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText("Forgot password?"));
    expect(screen.getByText("Back to sign in")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Back to sign in"));
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("shows error when forgot form submitted empty", async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText("Forgot password?"));
    fireEvent.click(screen.getByRole("button", { name: /Send Reset Instructions/i }));
    await waitFor(() => {
      expect(screen.getByText("Please enter your username.")).toBeInTheDocument();
    });
  });
});
