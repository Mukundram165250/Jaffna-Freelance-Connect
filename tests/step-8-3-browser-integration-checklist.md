# Step 8.3 — Browser integration checklist

## Safe demo mode
- [ ] Open the `step-8-1-discovery` branch preview and go to **Discover Freelancers & Services**.
- [ ] Tick **Show demo listings (fictional sample data)**.
- [ ] Confirm the status says **DEMO MODE — fictional examples only; nothing is saved.**
- [ ] Confirm every demo card says **DEMO · NOT A REAL SERVICE**.
- [ ] Untick demo mode and confirm the page switches back to live Supabase search.
- [ ] Confirm demo cards never appear as real rows in the Supabase `service_listings` table.

## Search behaviour
- [ ] Search `logo`; only the demo logo listing should remain.
- [ ] Choose **Online**; only online listings should remain.
- [ ] Choose **Local** and area `Negombo`; the tutoring demo should remain.
- [ ] Set minimum price to `3000`; the LKR 2,500 tutoring example should disappear.
- [ ] Enable **Available now only**; only examples marked available should remain.
- [ ] Sort by low-to-high price and confirm LKR 2,500 appears before LKR 5,000.
- [ ] Set minimum price greater than maximum price; confirm a validation message appears.

## Live Supabase path
- [ ] With demo mode off, confirm live results are loaded through `search_service_listings`.
- [ ] With no real listings in the database, confirm the empty-state message is friendly and no sample listing is shown.
- [ ] Test at desktop and mobile widths; confirm filter controls and result cards do not overflow.
- [ ] Check the browser console and Network panel for script errors, failed RPC calls, or unexpected table requests.

## Safety notes
- Demo records are hard-coded in the browser client and returned only when the user explicitly enables demo mode. They are never inserted into Supabase.
- The public client uses only the publishable key. Never add a Supabase secret or service-role key to browser code.
- Do not merge or deploy this branch until the manual browser checklist has been completed.
