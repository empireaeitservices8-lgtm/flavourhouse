const prisma = require("../config/db");

// GET /api/store/settings (Public)
async function getStoreSettings(req, res) {
  try {
    let settings = await prisma.storeSettings.findFirst();
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          storeName: "Flavour House",
          logo: "/logo.png",
          email: "support@flavorhousefoods.com",
          phone: "+91 9876543210",
          address: "Flavour House, Food Processing Zone, Kochi, Kerala, India",
          deliveryCharge: 0,
          minFreeDelivery: 0,
          storeAvailability: true,
          facebookUrl: "https://www.facebook.com/share/17rmar29kM/?mibextid=wwXIfr",
          instagramUrl: "https://www.instagram.com/flavorhouse.in?igsh=bGY2aWhpeWM1NHBj&utm_source=qr",
          youtubeUrl: "https://youtube.com/@flavorhousefoods?si=nwsDzLaJsmPDj0rD",
        },
      });
    }

    return res.json({ success: true, settings });
  } catch (err) {
    console.error("getStoreSettings error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch store settings" });
  }
}

// PUT /api/admin/store/settings (Admin update)
async function updateStoreSettings(req, res) {
  try {
    const {
      storeName,
      logo,
      email,
      phone,
      address,
      deliveryCharge,
      minFreeDelivery,
      storeAvailability,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
    } = req.body;

    let settings = await prisma.storeSettings.findFirst();
    if (!settings) {
      settings = await prisma.storeSettings.create({ data: {} });
    }

    const updated = await prisma.storeSettings.update({
      where: { id: settings.id },
      data: {
        storeName: storeName !== undefined ? storeName.trim() : settings.storeName,
        logo: logo !== undefined ? logo.trim() : settings.logo,
        email: email !== undefined ? email.trim() : settings.email,
        phone: phone !== undefined ? phone.trim() : settings.phone,
        address: address !== undefined ? address.trim() : settings.address,
        deliveryCharge: deliveryCharge !== undefined ? Number(deliveryCharge) : settings.deliveryCharge,
        minFreeDelivery: minFreeDelivery !== undefined ? Number(minFreeDelivery) : settings.minFreeDelivery,
        storeAvailability: storeAvailability !== undefined ? Boolean(storeAvailability) : settings.storeAvailability,
        facebookUrl: facebookUrl !== undefined ? facebookUrl.trim() : settings.facebookUrl,
        instagramUrl: instagramUrl !== undefined ? instagramUrl.trim() : settings.instagramUrl,
        youtubeUrl: youtubeUrl !== undefined ? youtubeUrl.trim() : settings.youtubeUrl,
      },
    });

    return res.json({
      success: true,
      settings: updated,
      message: "Store settings updated successfully",
    });
  } catch (err) {
    console.error("updateStoreSettings error:", err);
    return res.status(500).json({ success: false, error: "Failed to update store settings" });
  }
}

module.exports = {
  getStoreSettings,
  updateStoreSettings,
};

