import nodemailer from "nodemailer";
import { query } from "@/lib/db";

export interface OrderEmailData {
  orderId: number | string;
  orderNumber: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    alternatePhone?: string;
  };
  deliveryAddress: {
    houseName: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  items: Array<{
    productNameSnapshot: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  orderNotificationEmail: string;
  enabled: boolean;
}

export async function getSmtpConfig(): Promise<SmtpConfig> {
  let dbSettings: any = null;
  try {
    const rows = await query<any[]>("SELECT * FROM store_settings LIMIT 1");
    if (rows && rows.length > 0) {
      dbSettings = rows[0];
    }
  } catch (err: any) {
    console.warn("Could not load email settings from DB:", err.message);
  }

  const host = process.env.SMTP_HOST || dbSettings?.smtpHost || "smtp.hostinger.com";
  const port = Number(process.env.SMTP_PORT || dbSettings?.smtpPort || 465);
  const secure = port === 465;
  const user = process.env.SMTP_USER || dbSettings?.smtpUser || process.env.ADMIN_EMAIL || "support@flavorhousefoods.com";
  const pass = process.env.SMTP_PASS || dbSettings?.smtpPass || "";
  const fromName = dbSettings?.storeName || "Flavour House Foods";
  const from = `"${fromName}" <${user}>`;
  const orderNotificationEmail =
    process.env.ORDER_NOTIFICATION_EMAIL ||
    dbSettings?.orderNotificationEmail ||
    dbSettings?.email ||
    "support@flavorhousefoods.com";
  const enabled = dbSettings?.emailNotificationsEnabled !== 0;

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    orderNotificationEmail,
    enabled,
  };
}

export function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendOrderNotificationEmail(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getSmtpConfig();

    if (!config.enabled) {
      console.log("Email notifications are disabled in store settings.");
      return { success: true };
    }

    if (!config.pass) {
      console.warn("SMTP password not configured. Skipping email dispatch. Order was saved successfully.");
      return { success: false, error: "SMTP password not set" };
    }

    const transporter = createTransporter(config);

    const itemsHtml = data.items
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 8px; font-size: 14px; color: #333;">${it.productNameSnapshot}</td>
          <td style="padding: 10px 8px; font-size: 14px; text-align: center; color: #555;">${it.quantity}</td>
          <td style="padding: 10px 8px; font-size: 14px; text-align: right; color: #555;">₹${it.unitPrice}</td>
          <td style="padding: 10px 8px; font-size: 14px; text-align: right; font-weight: 600; color: #333;">₹${it.totalPrice}</td>
        </tr>
      `
      )
      .join("");

    const addressStr = `${data.deliveryAddress.houseName}, ${data.deliveryAddress.street}, ${data.deliveryAddress.city}, ${data.deliveryAddress.state} - ${data.deliveryAddress.pincode}`;

    // Admin Notification Email
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Order Alert - ${data.orderNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f7f4ed; margin: 0; padding: 24px; color: #2D2318;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e8dcce;">
          <div style="background: #2D2318; padding: 24px; text-align: center;">
            <h1 style="color: #b8945f; margin: 0; font-size: 22px; letter-spacing: 1px;">Flavour House</h1>
            <p style="color: #f5eedf; margin: 6px 0 0; font-size: 14px;">🎉 New Order Received!</p>
          </div>
          
          <div style="padding: 24px;">
            <div style="background: #fdfaf5; border: 1px solid #ebdcc5; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
              <p style="margin: 0 0 6px; font-size: 15px;"><strong>Order Number:</strong> <span style="color: #b8945f; font-weight: bold;">${data.orderNumber}</span></p>
              <p style="margin: 0 0 6px; font-size: 14px;"><strong>Payment Method:</strong> ${data.paymentMethod} (${data.paymentStatus})</p>
              <p style="margin: 0; font-size: 14px;"><strong>Total Amount:</strong> <span style="font-size: 16px; font-weight: bold; color: #15803d;">₹${data.totalAmount}</span></p>
            </div>

            <h3 style="color: #6E5432; border-bottom: 2px solid #ebdcc5; padding-bottom: 6px; margin-top: 24px; font-size: 16px;">Customer Details</h3>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Name:</strong> ${data.customer.fullName}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Phone:</strong> <a href="tel:${data.customer.phone}" style="color: #b8945f; text-decoration: none;">${data.customer.phone}</a> ${data.customer.alternatePhone ? `(Alt: ${data.customer.alternatePhone})` : ""}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${data.customer.email}" style="color: #b8945f; text-decoration: none;">${data.customer.email}</a></p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Delivery Address:</strong> ${addressStr}</p>

            <h3 style="color: #6E5432; border-bottom: 2px solid #ebdcc5; padding-bottom: 6px; margin-top: 24px; font-size: 16px;">Ordered Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background: #f8f4ec; text-align: left;">
                  <th style="padding: 8px; font-size: 13px; color: #6E5432;">Item</th>
                  <th style="padding: 8px; font-size: 13px; text-align: center; color: #6E5432;">Qty</th>
                  <th style="padding: 8px; font-size: 13px; text-align: right; color: #6E5432;">Price</th>
                  <th style="padding: 8px; font-size: 13px; text-align: right; color: #6E5432;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="margin-top: 16px; text-align: right; border-top: 2px solid #ebdcc5; padding-top: 12px;">
              <p style="margin: 4px 0; font-size: 13px; color: #666;">Subtotal: ₹${data.subtotal}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #666;">Delivery Fee: ₹${data.deliveryCharge}</p>
              <p style="margin: 6px 0 0; font-size: 18px; font-weight: bold; color: #2D2318;">Grand Total: ₹${data.totalAmount}</p>
            </div>
          </div>

          <div style="background: #f8f4ec; padding: 14px; text-align: center; font-size: 12px; color: #887864; border-top: 1px solid #ebdcc5;">
            Manage this order in your <a href="https://www.flavorhousefoods.com/admin/orders" style="color: #b8945f; text-decoration: underline;">Admin Dashboard</a>.
          </div>
        </div>
      </body>
      </html>
    `;

    // Customer Confirmation Email
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Flavour House Order Confirmation - ${data.orderNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f7f4ed; margin: 0; padding: 24px; color: #2D2318;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e8dcce;">
          <div style="background: #2D2318; padding: 24px; text-align: center;">
            <h1 style="color: #b8945f; margin: 0; font-size: 22px; letter-spacing: 1px;">Flavour House</h1>
            <p style="color: #f5eedf; margin: 6px 0 0; font-size: 14px;">Thank you for your order, ${data.customer.fullName}!</p>
          </div>
          
          <div style="padding: 24px;">
            <p style="font-size: 15px; line-height: 1.5;">We have successfully received your order. We are carefully preparing your wholesome organic goodness!</p>
            
            <div style="background: #fdfaf5; border: 1px solid #ebdcc5; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
              <p style="margin: 0 0 6px; font-size: 15px;"><strong>Order ID:</strong> <span style="color: #b8945f; font-weight: bold;">${data.orderNumber}</span></p>
              <p style="margin: 0 0 6px; font-size: 14px;"><strong>Payment Method:</strong> ${data.paymentMethod} (${data.paymentStatus})</p>
              <p style="margin: 0; font-size: 14px;"><strong>Total:</strong> <span style="font-size: 16px; font-weight: bold; color: #15803d;">₹${data.totalAmount}</span></p>
            </div>

            <h3 style="color: #6E5432; border-bottom: 2px solid #ebdcc5; padding-bottom: 6px; margin-top: 24px; font-size: 16px;">Delivery Address</h3>
            <p style="margin: 6px 0; font-size: 14px; color: #444;">${addressStr}</p>

            <h3 style="color: #6E5432; border-bottom: 2px solid #ebdcc5; padding-bottom: 6px; margin-top: 24px; font-size: 16px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background: #f8f4ec; text-align: left;">
                  <th style="padding: 8px; font-size: 13px; color: #6E5432;">Item</th>
                  <th style="padding: 8px; font-size: 13px; text-align: center; color: #6E5432;">Qty</th>
                  <th style="padding: 8px; font-size: 13px; text-align: right; color: #6E5432;">Price</th>
                  <th style="padding: 8px; font-size: 13px; text-align: right; color: #6E5432;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="margin-top: 16px; text-align: right; border-top: 2px solid #ebdcc5; padding-top: 12px;">
              <p style="margin: 4px 0; font-size: 13px; color: #666;">Subtotal: ₹${data.subtotal}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #666;">Delivery: ₹${data.deliveryCharge}</p>
              <p style="margin: 6px 0 0; font-size: 18px; font-weight: bold; color: #2D2318;">Grand Total: ₹${data.totalAmount}</p>
            </div>
          </div>

          <div style="background: #f8f4ec; padding: 16px; text-align: center; font-size: 12px; color: #887864; border-top: 1px solid #ebdcc5;">
            Track your order anytime at <a href="https://www.flavorhousefoods.com/track-order" style="color: #b8945f; text-decoration: underline;">flavorhousefoods.com/track-order</a>.
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to Admin
    await transporter.sendMail({
      from: config.from,
      to: config.orderNotificationEmail,
      subject: `🚨 [New Order] ${data.orderNumber} - ₹${data.totalAmount} from ${data.customer.fullName}`,
      html: adminEmailHtml,
    });

    // Send to Customer if valid email
    if (data.customer.email && data.customer.email.includes("@")) {
      await transporter.sendMail({
        from: config.from,
        to: data.customer.email.trim(),
        subject: `Your Flavour House Order Confirmation (${data.orderNumber})`,
        html: customerEmailHtml,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("Order notification email failed:", err);
    return { success: false, error: err.message };
  }
}

export async function sendTestEmail(toEmail: string): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getSmtpConfig();
    if (!config.pass) {
      return { success: false, message: "SMTP Password is not configured in Store Settings." };
    }

    const transporter = createTransporter(config);
    await transporter.verify();

    await transporter.sendMail({
      from: config.from,
      to: toEmail,
      subject: "Test Email from Flavour House Store",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #faf7f2; border-radius: 8px;">
          <h2 style="color: #b8945f;">Flavour House Email Verification</h2>
          <p>Your SMTP mail configuration is working perfectly! You will receive order notifications at this email address.</p>
          <p style="color: #888; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    return { success: true, message: `Test email successfully sent to ${toEmail}!` };
  } catch (err: any) {
    console.error("Test email failed:", err);
    return { success: false, message: err.message || "Failed to send test email" };
  }
}

