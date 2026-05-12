import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AgentScanText from "./AgentScanText";

describe("AgentScanText", () => {
    it("renders the AgentScan wordmark", () => {
        render(<AgentScanText />);
        expect(screen.getByText("AgentScan")).toBeInTheDocument();
    });
});
