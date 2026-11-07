const prisma = require("../config/db");

// Helper to normalize phone numbers
function normalizePhone(phone) {
  if (!phone) return "";
  const cleaned = phone.toString().replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return cleaned.slice(1);
  }
  return cleaned;
}

// GET /api/customer/addresses
async function getAddresses(req, res) {
  try {
    const customerId = req.customer.id;
    const addresses = await prisma.address.findMany({
      where: { customerId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return res.json({
      success: true,
      addresses,
    });
  } catch (err) {
    console.error("Error fetching addresses:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch saved addresses." });
  }
}

// POST /api/customer/addresses
async function createAddress(req, res) {
  try {
    const customerId = req.customer.id;
    const { fullName, phone, houseName, street, city, state, pincode, isDefault } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, error: "Recipient name is required." });
    }
    const normPhone = normalizePhone(phone);
    if (!normPhone || normPhone.length < 10) {
      return res.status(400).json({ success: false, error: "Valid 10-digit phone number is required." });
    }
    if (!houseName || !houseName.trim()) {
      return res.status(400).json({ success: false, error: "House / Flat / Building name is required." });
    }
    if (!street || !street.trim()) {
      return res.status(400).json({ success: false, error: "Street / Area is required." });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, error: "City / District is required." });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ success: false, error: "State is required." });
    }
    if (!pincode || !pincode.trim() || pincode.trim().length !== 6) {
      return res.status(400).json({ success: false, error: "Valid 6-digit PIN code is required." });
    }

    // Count existing addresses
    const existingCount = await prisma.address.count({ where: { customerId } });
    const shouldBeDefault = Boolean(isDefault) || existingCount === 0;

    // Use transaction if setting default
    const newAddress = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault && existingCount > 0) {
        await tx.address.updateMany({
          where: { customerId },
          data: { isDefault: false },
        });
      }

      return await tx.address.create({
        data: {
          customerId,
          fullName: fullName.trim(),
          phone: normPhone,
          houseName: houseName.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          isDefault: shouldBeDefault,
        },
      });
    });

    return res.status(201).json({
      success: true,
      address: newAddress,
      message: "Address saved successfully.",
    });
  } catch (err) {
    console.error("Error creating address:", err);
    return res.status(500).json({ success: false, error: "Failed to save address." });
  }
}

// PUT /api/customer/addresses/:id
async function updateAddress(req, res) {
  try {
    const customerId = req.customer.id;
    const addressId = parseInt(req.params.id, 10);

    if (isNaN(addressId)) {
      return res.status(400).json({ success: false, error: "Invalid address ID." });
    }

    const existing = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existing || existing.customerId !== customerId) {
      return res.status(404).json({ success: false, error: "Address not found." });
    }

    const { fullName, phone, houseName, street, city, state, pincode, isDefault } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, error: "Recipient name is required." });
    }
    const normPhone = normalizePhone(phone);
    if (!normPhone || normPhone.length < 10) {
      return res.status(400).json({ success: false, error: "Valid 10-digit phone number is required." });
    }
    if (!houseName || !houseName.trim()) {
      return res.status(400).json({ success: false, error: "House / Flat / Building name is required." });
    }
    if (!street || !street.trim()) {
      return res.status(400).json({ success: false, error: "Street / Area is required." });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, error: "City / District is required." });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ success: false, error: "State is required." });
    }
    if (!pincode || !pincode.trim() || pincode.trim().length !== 6) {
      return res.status(400).json({ success: false, error: "Valid 6-digit PIN code is required." });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { customerId, id: { not: addressId } },
          data: { isDefault: false },
        });
      }

      return await tx.address.update({
        where: { id: addressId },
        data: {
          fullName: fullName.trim(),
          phone: normPhone,
          houseName: houseName.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          isDefault: isDefault ? true : existing.isDefault,
        },
      });
    });

    return res.json({
      success: true,
      address: updated,
      message: "Address updated successfully.",
    });
  } catch (err) {
    console.error("Error updating address:", err);
    return res.status(500).json({ success: false, error: "Failed to update address." });
  }
}

// DELETE /api/customer/addresses/:id
async function deleteAddress(req, res) {
  try {
    const customerId = req.customer.id;
    const addressId = parseInt(req.params.id, 10);

    if (isNaN(addressId)) {
      return res.status(400).json({ success: false, error: "Invalid address ID." });
    }

    const existing = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existing || existing.customerId !== customerId) {
      return res.status(404).json({ success: false, error: "Address not found." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id: addressId },
      });

      // If the deleted address was default, make the most recent one default
      if (existing.isDefault) {
        const remaining = await tx.address.findFirst({
          where: { customerId },
          orderBy: { createdAt: "desc" },
        });
        if (remaining) {
          await tx.address.update({
            where: { id: remaining.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return res.json({
      success: true,
      message: "Address removed successfully.",
    });
  } catch (err) {
    console.error("Error deleting address:", err);
    return res.status(500).json({ success: false, error: "Failed to delete address." });
  }
}

// PATCH /api/customer/addresses/:id/default
async function setDefaultAddress(req, res) {
  try {
    const customerId = req.customer.id;
    const addressId = parseInt(req.params.id, 10);

    if (isNaN(addressId)) {
      return res.status(400).json({ success: false, error: "Invalid address ID." });
    }

    const existing = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existing || existing.customerId !== customerId) {
      return res.status(404).json({ success: false, error: "Address not found." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
      await tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    return res.json({
      success: true,
      message: "Default address updated.",
    });
  } catch (err) {
    console.error("Error setting default address:", err);
    return res.status(500).json({ success: false, error: "Failed to set default address." });
  }
}

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};

