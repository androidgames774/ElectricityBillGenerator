# Tenant Electricity Bill Web App

A simple static web app for leased-unit electricity billing.

## Features
- Settings for property name, commercial unit price, fixed charge, and due days
- Multiple tenant reading rows
- Automatic calculations:
  - Units = end reading - start reading
  - Energy charge = units x unit price
  - Fixed share = fixed charge x (tenant units / total building units)
  - Total due = energy charge + fixed share
- Bill preview for any tenant
- Print / Save PDF using your browser
- Export CSV summary
- Save data locally in the browser

## How to use
1. Open `index.html` in a browser.
2. Update Settings.
3. Add or edit tenant rows.
4. Pick a tenant in Bill Preview.
5. Click **Print / Save PDF** and choose **Save as PDF**.

## Deploy options
- Open directly from your computer
- Upload to Netlify / Vercel / GitHub Pages
- Put behind your own domain later if needed
