export const WP_API_URL = process.env.WC_STORE_URL ? `${process.env.WC_STORE_URL}/wp-json/wp/v2` : "";

export async function getHomePageData() {
  if (!WP_API_URL) return null;
  
  try {
    // Fetch page with slug 'home' to get its ACF fields with standard formatting
    const res = await fetch(`${WP_API_URL}/pages?slug=home&_fields=id,title,acf&acf_format=standard`, { 
      cache: "no-store" // Always fetch fresh data from WordPress
    });
    
    if (!res.ok) return null;
    
    const pages = await res.json();
    if (pages && pages.length > 0) {
      return pages[0].acf || null;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch home page data from WP:", error);
    return null;
  }
}

export async function getComboOffersPageData() {
  if (!WP_API_URL) return null;
  
  try {
    // Fetch page with slug 'combo-offer' to get its ACF fields with standard formatting
    const res = await fetch(`${WP_API_URL}/pages?slug=combo-offer&_fields=id,title,acf&acf_format=standard`, { 
      cache: "no-store" // Always fetch fresh data from WordPress
    });
    
    if (!res.ok) return null;
    
    const pages = await res.json();
    if (pages && pages.length > 0) {
      return pages[0].acf || null;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch combo offers page data from WP:", error);
    return null;
  }
}

export async function getAboutPageData() {
  if (!WP_API_URL) return null;
  
  try {
    const res = await fetch(`${WP_API_URL}/pages?slug=about&_fields=id,title,acf&acf_format=standard`, { 
      cache: "no-store"
    });
    
    if (!res.ok) return null;
    
    const pages = await res.json();
    if (pages && pages.length > 0) {
      return pages[0].acf || null;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch about page data from WP:", error);
    return null;
  }
}

export async function getRecipesPageData() {
  if (!WP_API_URL) return null;
  
  try {
    const res = await fetch(`${WP_API_URL}/pages?slug=recipes-page-content&_fields=id,title,acf&acf_format=standard`, { 
      cache: "no-store"
    });
    
    if (!res.ok) return null;
    
    const pages = await res.json();
    if (pages && pages.length > 0) {
      return pages[0].acf || null;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch recipes page data from WP:", error);
    return null;
  }
}


