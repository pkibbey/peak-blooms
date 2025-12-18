import { describe, expect, it } from "vitest"
import { checkoutSchema, createOrderSchema } from "@/lib/validations/checkout"

describe("checkoutSchema (form validation)", () => {
  const validCheckoutData = {
    notes: "Please deliver in the morning",
    selectedAddressId: "address-1",
    deliveryAddress: {
      firstName: "Jane",
      lastName: "Smith",
      company: "Tech Corp",
      street1: "456 Oak Ave",
      street2: "Suite 100",
      city: "Seattle",
      state: "WA",
      zip: "98101",
      country: "US",
      email: "jane@example.com",
      phone: "+1-206-555-0100",
    },
    saveDeliveryAddress: true,
  }

  describe("valid inputs", () => {
    it("should accept valid checkout data", () => {
      const result = checkoutSchema.safeParse(validCheckoutData)
      expect(result.success).toBe(true)
    })

    it("should accept checkout with empty notes", () => {
      const result = checkoutSchema.safeParse({
        ...validCheckoutData,
        notes: "",
      })
      expect(result.success).toBe(true)
    })

    it("should accept checkout with saveDeliveryAddress as false", () => {
      const result = checkoutSchema.safeParse({
        ...validCheckoutData,
        saveDeliveryAddress: false,
      })
      expect(result.success).toBe(true)
    })

    it("should validate nested deliveryAddress with all required fields", () => {
      const result = checkoutSchema.safeParse(validCheckoutData)
      expect(result.success).toBe(true)
    })
  })

  describe("invalid inputs", () => {
    it("should reject missing notes", () => {
      const { notes, ...noNotes } = validCheckoutData
      const result = checkoutSchema.safeParse(noNotes)
      expect(result.success).toBe(false)
    })

    it("should reject missing selectedAddressId", () => {
      const { selectedAddressId, ...noAddressId } = validCheckoutData
      const result = checkoutSchema.safeParse(noAddressId)
      expect(result.success).toBe(false)
    })

    it("should reject missing deliveryAddress", () => {
      const { deliveryAddress, ...noDeliveryAddress } = validCheckoutData
      const result = checkoutSchema.safeParse(noDeliveryAddress)
      expect(result.success).toBe(false)
    })

    it("should reject missing saveDeliveryAddress", () => {
      const { saveDeliveryAddress, ...noSaveFlag } = validCheckoutData
      const result = checkoutSchema.safeParse(noSaveFlag)
      expect(result.success).toBe(false)
    })

    it("should reject invalid deliveryAddress (missing company)", () => {
      const { company, ...addressWithoutCompany } = validCheckoutData.deliveryAddress
      const result = checkoutSchema.safeParse({
        ...validCheckoutData,
        deliveryAddress: addressWithoutCompany,
      })
      expect(result.success).toBe(false)
    })

    it("should reject invalid deliveryAddress (invalid email)", () => {
      const result = checkoutSchema.safeParse({
        ...validCheckoutData,
        deliveryAddress: {
          ...validCheckoutData.deliveryAddress,
          email: "not-an-email",
        },
      })
      expect(result.success).toBe(false)
    })

    it("should reject invalid deliveryAddress (invalid phone)", () => {
      const result = checkoutSchema.safeParse({
        ...validCheckoutData,
        deliveryAddress: {
          ...validCheckoutData.deliveryAddress,
          phone: "invalid",
        },
      })
      expect(result.success).toBe(false)
    })
  })
})

describe("createOrderSchema (API validation)", () => {
  const validOrderData = {
    deliveryAddressId: "address-1",
    deliveryAddress: null,
    saveDeliveryAddress: true,
    notes: "Please deliver after 5pm",
  }

  describe("valid inputs", () => {
    it("should accept valid order with existing address ID", () => {
      const result = createOrderSchema.safeParse(validOrderData)
      expect(result.success).toBe(true)
    })

    it("should accept order with null deliveryAddressId", () => {
      const result = createOrderSchema.safeParse({
        ...validOrderData,
        deliveryAddressId: null,
      })
      expect(result.success).toBe(true)
    })

    it("should accept order with null deliveryAddress", () => {
      const result = createOrderSchema.safeParse({
        ...validOrderData,
        deliveryAddress: null,
      })
      expect(result.success).toBe(true)
    })

    it("should accept order with new address object", () => {
      const result = createOrderSchema.safeParse({
        ...validOrderData,
        deliveryAddressId: null,
        deliveryAddress: {
          firstName: "John",
          lastName: "Doe",
          company: "Acme",
          street1: "123 Main",
          street2: "",
          city: "Portland",
          state: "OR",
          zip: "97201",
          country: "US",
          email: "john@example.com",
          phone: "+1-503-555-0123",
        },
      })
      expect(result.success).toBe(true)
    })

    it("should accept order with optional saveDeliveryAddress", () => {
      const { saveDeliveryAddress, ...withoutSave } = validOrderData
      const result = createOrderSchema.safeParse(withoutSave)
      expect(result.success).toBe(true)
    })

    it("should accept order with null notes", () => {
      const result = createOrderSchema.safeParse({
        ...validOrderData,
        notes: null,
      })
      expect(result.success).toBe(true)
    })

    it("should accept order with empty notes string", () => {
      const result = createOrderSchema.safeParse({
        ...validOrderData,
        notes: "",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("invalid inputs", () => {
    it("should reject invalid deliveryAddress email", () => {
      const result = createOrderSchema.safeParse({
        deliveryAddressId: null,
        deliveryAddress: {
          firstName: "Jane",
          lastName: "Doe",
          company: "TechCorp",
          street1: "456 Oak",
          street2: "",
          city: "Seattle",
          state: "WA",
          zip: "98101",
          country: "US",
          email: "invalid-email",
          phone: "+1-206-555-0100",
        },
        saveDeliveryAddress: true,
        notes: "Test",
      })
      expect(result.success).toBe(false)
    })

    it("should reject invalid deliveryAddress phone", () => {
      const result = createOrderSchema.safeParse({
        deliveryAddressId: null,
        deliveryAddress: {
          firstName: "Jane",
          lastName: "Doe",
          company: "TechCorp",
          street1: "456 Oak",
          street2: "",
          city: "Seattle",
          state: "WA",
          zip: "98101",
          country: "US",
          email: "jane@example.com",
          phone: "invalid",
        },
        saveDeliveryAddress: true,
        notes: "Test",
      })
      expect(result.success).toBe(false)
    })

    it("should reject deliveryAddress missing required fields", () => {
      const result = createOrderSchema.safeParse({
        deliveryAddressId: null,
        deliveryAddress: {
          firstName: "Jane",
          // missing lastName and other required fields
        },
        saveDeliveryAddress: true,
        notes: "Test",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("type inference", () => {
    it("should correctly infer CreateOrderInput type", () => {
      const result = createOrderSchema.safeParse(validOrderData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.deliveryAddressId).toEqual("address-1")
        expect(result.data.deliveryAddress).toBeNull()
      }
    })
  })
})
