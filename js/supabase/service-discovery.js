/**
 * Public, read-only service discovery client.
 * Demo records are fictional, local-only examples; they are never inserted into Supabase.
 */
(function () {
  const demoListings = [
    { listing_id:'demo-1', title:'DEMO: Modern Logo & Brand Kit', description:'Fictional example: logo concepts, colour palette and a simple brand guide.', category:'Design & Creative', service_scope:'online', fulfilment_type:'completion_deadline', price_type:'fixed', pricing_mode:'freelancer_set', freelancer_price:5000, currency:'LKR', service_area:null, freelancer_name:'Kavindi Perera', average_rating:4.8, review_count:12, available_now:true, created_at:'2026-10-08T10:00:00Z' },
    { listing_id:'demo-2', title:'DEMO: Mathematics Tutoring', description:'Fictional example: one-to-one maths support and practice questions.', category:'Education & Tutoring', service_scope:'local', fulfilment_type:'appointment', price_type:'hourly', pricing_mode:'freelancer_set', freelancer_price:2500, currency:'LKR', service_area:'Negombo', freelancer_name:'Arun Sivarajah', average_rating:4.9, review_count:8, available_now:true, created_at:'2026-10-07T10:00:00Z' },
    { listing_id:'demo-3', title:'DEMO: Simple Website Setup', description:'Fictional example: a starter website for a club, portfolio or local business.', category:'Web Development', service_scope:'online', fulfilment_type:'completion_deadline', price_type:'fixed', pricing_mode:'freelancer_set', freelancer_price:12000, currency:'LKR', service_area:null, freelancer_name:'Nethmi Fernando', average_rating:0, review_count:0, available_now:false, created_at:'2026-10-06T10:00:00Z' },
    { listing_id:'demo-4', title:'DEMO: Event Photography', description:'Fictional example: photography coverage for a small event.', category:'Photography', service_scope:'local', fulfilment_type:'appointment', price_type:'fixed', pricing_mode:'freelancer_set', freelancer_price:8000, currency:'LKR', service_area:'Jaffna', freelancer_name:'Tharushan Raj', average_rating:4.6, review_count:5, available_now:false, created_at:'2026-10-05T10:00:00Z' }
  ];

  const filterDemoListings = filters => {
    const q = String(filters.search || '').trim().toLowerCase();
    const category = String(filters.category || '').trim().toLowerCase();
    const area = String(filters.area || '').trim().toLowerCase();
    const min = filters.minPrice === '' || filters.minPrice == null ? null : Number(filters.minPrice);
    const max = filters.maxPrice === '' || filters.maxPrice == null ? null : Number(filters.maxPrice);
    let rows = demoListings.filter(item => {
      const haystack = [item.title, item.description, item.category, item.freelancer_name].join(' ').toLowerCase();
      return (!q || haystack.includes(q)) && (!category || item.category.toLowerCase().includes(category))
        && (!filters.scope || item.service_scope === filters.scope)
        && (!area || (item.service_scope === 'local' && String(item.service_area || '').toLowerCase().includes(area)))
        && (min == null || item.freelancer_price >= min) && (max == null || item.freelancer_price <= max)
        && (!filters.availableNow || item.available_now);
    });
    if (filters.sort === 'price_low') rows.sort((a,b) => a.freelancer_price - b.freelancer_price);
    else if (filters.sort === 'price_high') rows.sort((a,b) => b.freelancer_price - a.freelancer_price);
    else if (filters.sort === 'rating') rows.sort((a,b) => b.average_rating - a.average_rating);
    else if (filters.sort === 'available') rows.sort((a,b) => Number(b.available_now) - Number(a.available_now));
    else rows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    return rows.slice(Math.max(0, Number(filters.offset) || 0), Math.max(0, Number(filters.offset) || 0) + Math.min(50, Math.max(1, Number(filters.limit) || 20)));
  };

  const config = window.VIBELANCERS_SUPABASE_CONFIG;
  const canUseLive = !!(window.supabase && config && config.url && config.publishableKey);
  const client = canUseLive ? window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  }) : null;

  window.VibelancersServiceDiscovery = {
    ready: canUseLive,
    async search(filters = {}) {
      if (filters.demoMode) return { data: filterDemoListings(filters), error: null };
      if (!client) return { data: null, error: new Error('Live search is not configured. Turn on demo listings to preview the interface.') };
      const numberOrNull = value => {
        if (value === '' || value === null || value === undefined) return null;
        const number = Number(value);
        return Number.isFinite(number) && number >= 0 ? number : null;
      };
      return client.rpc('search_service_listings', {
        p_search: String(filters.search || '').trim() || null,
        p_category: String(filters.category || '').trim() || null,
        p_service_scope: ['local', 'online'].includes(filters.scope) ? filters.scope : null,
        p_service_area: String(filters.area || '').trim() || null,
        p_available_now: filters.availableNow ? true : null,
        p_min_price: numberOrNull(filters.minPrice),
        p_max_price: numberOrNull(filters.maxPrice),
        p_sort: ['recommended', 'price_low', 'price_high', 'rating', 'available'].includes(filters.sort) ? filters.sort : 'recommended',
        p_limit: Math.min(50, Math.max(1, Number(filters.limit) || 20)),
        p_offset: Math.max(0, Number(filters.offset) || 0)
      });
    }
  };
})();
