import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import LogPage from "../pages/LogPage";

// Mock the hooks module so mutations don't hit the real API
const mockMutateAsync = vi.fn().mockResolvedValue({});

vi.mock("../hooks/useHealthData", () => ({
  useAddHealthLog: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderLogPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <LogPage />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe("LogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the log form", () => {
    renderLogPage();
    expect(screen.getByText("Log Health Data")).toBeInTheDocument();
    expect(screen.getByTestId("log-form")).toBeInTheDocument();
  });

  it("defaults to WEIGHT type", () => {
    renderLogPage();
    expect(screen.getByTestId("weight-input")).toBeInTheDocument();
  });

  it("switches to BLOOD_PRESSURE type when the BP button is clicked", async () => {
    renderLogPage();
    const bpBtn = screen.getByText("Blood Pressure");
    await userEvent.click(bpBtn);
    expect(screen.getByTestId("systolic-input")).toBeInTheDocument();
    expect(screen.getByTestId("diastolic-input")).toBeInTheDocument();
  });

  it("switches to HEART_RATE type when the HR button is clicked", async () => {
    renderLogPage();
    const hrBtn = screen.getByText("Heart Rate");
    await userEvent.click(hrBtn);
    expect(screen.getByTestId("bpm-input")).toBeInTheDocument();
  });

  it("shows toast error when submitting empty weight", async () => {
    const { toast } = await import("sonner");
    renderLogPage();
    const submitBtn = screen.getByTestId("submit-log-btn");
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please enter your weight.");
    });
  });

  it("shows toast error for invalid BP (sys <= dia)", async () => {
    const { toast } = await import("sonner");
    renderLogPage();
    // Switch to BP
    const bpBtn = screen.getByText("Blood Pressure");
    await userEvent.click(bpBtn);
    // Enter invalid values (sys < dia)
    const sysInput = screen.getByTestId("systolic-input");
    const diaInput = screen.getByTestId("diastolic-input");
    await userEvent.clear(sysInput);
    await userEvent.type(sysInput, "80");
    await userEvent.clear(diaInput);
    await userEvent.type(diaInput, "120");
    fireEvent.click(screen.getByTestId("submit-log-btn"));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Systolic pressure must be greater than diastolic.");
    });
  });

  it("submits valid weight log without errors", async () => {
    mockMutateAsync.mockClear();
    renderLogPage();
    const weightInput = screen.getByTestId("weight-input");
    await userEvent.type(weightInput, "70.5");
    fireEvent.click(screen.getByTestId("submit-log-btn"));
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ type: "WEIGHT", weight: 70.5 }),
      );
    });
  });
});
