# Functional Requirements

## Overview
Peak Blooms is a wholesale flower shop application designed to operate as a clean, efficient B2B e-commerce store while incorporating B2C-like inspirational content to appeal to smaller florist businesses.

## User Roles

### 1. Customer
- **Access:** Requires approval.
- **Capabilities:**
  - View full store with prices.
  - Add items to shopping cart.
  - Checkout and purchase.
  - View inspirational content.

### 2. Admin
- **Capabilities:**
  - Manage products and inventory.
  - Approve or reject new customer account requests.
  - View analytics and user stats.
  - Manage content.

### 3. Guest (Unauthenticated/Unapproved)
- **Capabilities:**
  - View full store products (catalog mode).
  - View inspirational content.
- **Restrictions:**
  - **Prices:** Hidden.
  - **Shopping Cart:** Disabled/Hidden.
  - **Checkout:** Disabled.

## Core Features

### User Authentication & Approval
- **Registration:** Users can submit a request for a customer account.
- **Approval Workflow:** New accounts are pending until approved by an Admin.
- **Login:** Standard secure login for approved customers and admins.

### Product Catalog & Search
- **Full Text Search:** Robust search capability to find products easily.
- **Visibility:** Products are visible to all users.
- **Pricing:** Visible only to logged-in, approved customers.

### Shopping Experience
- **Cart:** Functional only for approved customers.
- **Checkout:** Streamlined B2B checkout process.

### Navigation
- **Global Navigation:** Persistent top-level menu.
- **Interaction:** Menu items must be directly accessible; no hiding items in mouseover dropdowns.

### Analytics & Lead Generation
- **Usage Stats:** Collection of user behavior data to inform UI improvements.
- **Lead Collection:** Mechanisms to capture details from potential new business leads (e.g., inquiry forms, newsletter signup for guests).

### Content
- **Inspirational Content:** Blog-like or gallery sections showcasing floral arrangements to inspire florists.
