import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import ContactInfo from "./ContactInfo"

describe("ContactInfo component", () => {
  it("renders name, email (with label), and phone (with label) in default mode", () => {
    render(<ContactInfo name="Alice Jones" email="alice@example.com" phone="(555) 123-4567" />)

    expect(screen.getByText("Alice Jones")).toBeInTheDocument()

    // labels should be present in non-compact mode
    expect(screen.getByText("Email:")).toBeInTheDocument()
    expect(screen.getByText("alice@example.com")).toBeInTheDocument()

    expect(screen.getByText("Phone:")).toBeInTheDocument()
    expect(screen.getByText("(555) 123-4567")).toBeInTheDocument()
  })

  it('renders compact mode: name and email without the "Email:" label', () => {
    render(<ContactInfo name="Bob" email="bob@example.com" compact />)

    expect(screen.getByText("Bob")).toBeInTheDocument()
    expect(screen.getByText("bob@example.com")).toBeInTheDocument()

    // compact mode should NOT render the "Email:" label
    expect(screen.queryByText("Email:")).toBeNull()
  })

  it("renders placeholder when no data provided", () => {
    render(<ContactInfo />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })
})
