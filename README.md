# Shopify + Klaviyo Multi-Step Popup

A custom two-step Shopify storefront popup that collects a visitor's contact details, asks whether they have children, and stores birthday information in organized Klaviyo profiles and lists.

This repository is a reusable, sanitized version of a client implementation. Account-specific Klaviyo IDs have been replaced with placeholders.

## Features

- Email and optional phone collection
- Follow-up question shown only after the first form is completed
- Dynamic birthday fields for up to four children
- Klaviyo list subscriptions through the client API
- Custom profile properties for signup source and birthday data
- Loading, validation, success and error states
- Responsive modal styling

## Files

- `popup-forms.liquid` — popup markup
- `styles.css` — component styles
- `script.js` — form state, validation and Klaviyo requests

## Setup

1. Add the markup, styles and script to the appropriate Shopify theme files.
2. In `script.js`, replace these placeholders with values from your own Klaviyo account:
   - `YOUR_PUBLIC_COMPANY_ID`
   - `YOUR_LEADS_LIST_ID`
   - `YOUR_CHILDREN_LIST_ID`
3. Test both flows in a development theme before publishing.
4. Confirm that your consent copy and data collection flow meet the privacy and marketing rules that apply to your store and customers.

The Klaviyo company ID and list IDs used by this browser-side implementation are account-specific configuration values, not private API keys. A private Klaviyo API key must never be placed in storefront code.

## Client Implementation

Originally developed for [Silly Goose Kids](https://sillygoosekids.ca/). The screenshots below show the implemented storefront flow.

<img width="1514" height="817" alt="Welcome popup" src="https://github.com/user-attachments/assets/b28a3958-c0d1-4879-8e81-8b477e711349" />

<img width="1491" height="813" alt="Contact form" src="https://github.com/user-attachments/assets/ae53d2fe-0f3b-4c5f-9c50-814dbee9efdc" />

<img width="1534" height="791" alt="Children question" src="https://github.com/user-attachments/assets/ff16b760-55eb-4669-b9f6-4ba3071cacab" />

<img width="1468" height="800" alt="Birthday details form" src="https://github.com/user-attachments/assets/872574a2-9c4e-40aa-9df4-2e60d3f2a452" />

<img width="1447" height="800" alt="Success state" src="https://github.com/user-attachments/assets/18c81aed-26a0-4bbb-9383-8be7b535578b" />

## Notes

This is a focused code sample rather than a complete Shopify theme. Theme placement and styling may need to be adapted to the target storefront.
