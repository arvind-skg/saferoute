# SafeRoute

SafeRoute is a navigation application designed to prioritize safety. It features a React frontend and an Express/SQLite backend, allowing users to find safe routes, log trips, and make reports.

## Getting Started

### Prerequisites

- Node.js installed on your machine.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Backend Server:
   ```bash
   npm run server
   ```
   The backend server will run and use a local SQLite database (`server/saferoute.db`).

3. Start the Frontend Development Server:
   ```bash
   npm run dev
   ```

## Tech Stack
- **Frontend:** React, Vite, Leaflet, TailwindCSS
- **Backend:** Node.js, Express, better-sqlite3
