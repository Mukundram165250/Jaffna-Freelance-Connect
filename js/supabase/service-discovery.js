/**
 * Public, read-only service discovery client.
 * Calls the curated search_service_listings RPC; never accesses private tables directly.
 */
(function () {
  const config = window.VIBELANCERS_SUPABASE_CONFIG;
  if (!window.supabase || !config || !config.url || !config.publishableKey) {
    window.VibelancersServiceDiscovery = {
      ready: false,
      search: async function () {
        return { data: null, error: new Error("Service search is not configured. Please refresh or try again later.") };
      }
    };
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  window.VibelancersServiceDiscovery = {
    ready: true,
    async search(filters = {}) {
      const numberOrNull = value => {
        if (value === "" || value === null || value === undefined) return null;
        const number = Number(value);
        return Number.isFinite(number) && number >= 0 ? number : null;
      };

      return client.rpc("search_service_listings", {
        p_search: String(filters.search || "").trim() || null,
        p_category: String(filters.category || "").trim() || null,
        p_service_scope: ["local", "online"].includes(filters.scope) ? filters.scope : null,
        p_service_area: String(filters.area || "").trim() || null,
        p_available_now: filters.availableNow ? true : null,
        p_min_price: numberOrNull(filters.minPrice),
        p_max_price: numberOrNull(filters.maxPrice),
        p_sort: ["recommended", "price_low", "price_high", "rating", "available"].includes(filters.sort)
          ? filters.sort
          : "recommended",
        p_limit: Math.min(50, Math.max(1, Number(filters.limit) || 20)),
        p_offset: Math.max(0, Number(filters.offset) || 0)
      });
    }
  };
})();
