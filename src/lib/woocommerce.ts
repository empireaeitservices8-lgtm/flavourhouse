import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// Ensure these environment variables are set in .env.local
// WC_STORE_URL=https://your-wordpress-site.com
// WC_CONSUMER_KEY=ck_your_consumer_key
// WC_CONSUMER_SECRET=cs_your_consumer_secret

export const api = new WooCommerceRestApi({
  url: process.env.WC_STORE_URL || "https://dummy-url-to-prevent-crash.com",
  consumerKey: process.env.WC_CONSUMER_KEY || "dummy_key",
  consumerSecret: process.env.WC_CONSUMER_SECRET || "dummy_secret",
  version: "wc/v3",
});
