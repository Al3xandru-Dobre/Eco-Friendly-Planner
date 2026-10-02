# Eco-Friendly Planner

A sustainable travel planner. Plan a trip, see the carbon cost of getting there, then book eco-certified stays and sustainable restaurants at the destination through a dedicated booking service. Every booking reports its estimated footprint and what it saves against a conventional equivalent.

## Architecture

```
┌──────────────┐   /graphql     ┌──────────────────────┐
│   client     │ ─────────────▶ │  server (planner)    │  users, trips, transport carbon
│ React + Vite │                │  GraphQL · :4000     │──┐
│  nginx :3000 │   /booking-api └──────────────────────┘  │ forwards the user's JWT
│              │ ─────────────▶ ┌──────────────────────┐  │ to read a trip's bookings
└──────────────┘                │  booking-api         │◀─┘
                                │  REST · :5000        │  hotels, restaurants,
                                └──────────────────────┘  availability, bookings
                                        │        │
                                 eco_travel_planner   eco_bookings   (MongoDB 6, one DB each)
```

The three services are independent deployables:

| Service | Stack | Purpose |
|---|---|---|
| `client/` | React 19, Vite, plain CSS design system | Trip planning UI, venue discovery, booking flows, dark mode, responsive |
| `server/` | Node, Apollo Server (GraphQL), Mongoose | Accounts (JWT), trips, transport carbon and eco score; exposes a trip's bookings by calling the booking API |
| `booking-api/` | Node, Express, Mongoose | Eco-certified hotels and sustainable restaurants, live availability, reservations, cost and carbon summaries; OpenAPI documented |

Authentication is shared: the booking API verifies the planner's JWT with the same `JWT_SECRET`, so a single login covers both APIs and the booking API can enforce ownership of bookings without its own user store.

## Quick start (Docker)

```bash
cp .env.example .env          # set JWT_SECRET
docker compose up --build
```

| URL | What |
|---|---|
| http://localhost:3000 | Web app |
| http://localhost:4000/graphql | Planner GraphQL (Apollo Sandbox in development) |
| http://localhost:5000/api/v1/docs | Booking API reference (OpenAPI) |
| http://localhost:5000/health | Booking API health and catalogue size |

The booking API seeds a sample catalogue of 14 stays and 14 restaurants across 12 European cities on first start. The venues are fictional and illustrative.

## Running locally without Docker

You need Node 18+ and a MongoDB instance (or run the booking API with the in-memory driver).

```bash
# Booking API
cd booking-api && cp .env.example .env && npm install && npm run dev
#   DATA_DRIVER=memory JWT_SECRET=dev npm start   # no MongoDB needed

# Planner GraphQL server
cd server/src && npm install
JWT_SECRET=dev MONGO_URI=mongodb://localhost:27017/eco_travel_planner BOOKING_API_URL=http://localhost:5000 npm run dev

# Client (Vite proxies /graphql -> :4000 and /booking-api -> :5000)
cd client && npm install && npm run dev
```

Use the same `JWT_SECRET` for the planner and the booking API.

## Booking API

Base path `/api/v1`. Public catalogue endpoints need no token; everything under `/bookings` needs `Authorization: Bearer <planner JWT>`.

| Method | Path | Description |
|---|---|---|
| GET | `/hotels` | Search stays: `city`, `country`, `q`, `certification`, `feature`, `minEcoScore`, `minRating`, `maxPrice`, `sort`, `page`, `limit`; add `checkIn`, `checkOut`, `guests`, `rooms` to keep only hotels with availability |
| GET | `/hotels/{id}` | Hotel details, room types, certifications, per-night carbon |
| GET | `/hotels/{id}/availability` | Rooms left per room type for a stay, with total price and eco impact |
| GET | `/restaurants` | Search dining: `city`, `cuisine`, `dietary`, `certification`, `feature`, `maxPriceLevel`, `minEcoScore`, …; add `date`, `time`, `partySize` to keep only restaurants with a free slot |
| GET | `/restaurants/{id}` | Restaurant details, opening hours, per-meal carbon |
| GET | `/restaurants/{id}/availability` | Bookable time slots and seats left for a date and party size |
| POST | `/bookings/hotels` | Book a room: `hotelId`, `roomTypeCode`, `checkIn`, `checkOut`, `guests`, `rooms`, `tripId?`, `notes?` |
| POST | `/bookings/restaurants` | Reserve a table: `restaurantId`, `date`, `time`, `partySize`, `tripId?`, `notes?` |
| GET | `/bookings` | My bookings, filter by `tripId`, `status`, `type` |
| GET | `/bookings/summary` | Confirmed count, room-nights, covers, totals per currency, carbon and savings (optionally for one `tripId`) |
| GET | `/bookings/{id}` · DELETE `/bookings/{id}` | Read or cancel (soft, idempotent) one of my bookings |
| GET | `/destinations` · `/reference` | Cities with venue counts; enumerations and eco baselines |

Errors are JSON: `{ "error": { "code", "message", "details?" } }` with `400` validation, `401` missing token, `403` not the owner, `404` unknown, `409` no availability.

### Booking rules

- A hotel booking occupies one or more rooms of a room type for `[checkIn, checkOut)`; a stay that begins on another's check-out day does not overlap. Guests must fit `capacity × rooms`.
- A restaurant reservation occupies seats for 90 minutes from its slot. Slots run every 30 minutes within opening hours. A slot is bookable when the covers of all overlapping confirmed reservations plus the new party fit the seating capacity.
- Cancellation is soft (`status: CANCELLED`) and immediately frees rooms or seats.

### Eco model

All factors are indicative and live in one place (`booking-api/src/domain/ecoImpact.js`). A stay is compared with 20 kg CO₂e per guest-night, a meal with 3.5 kg per cover. Venue eco scores (0–100) weight measured carbon intensity (up to 60 points) above certifications (up to 24) and declared features (up to 16). The planner's trip score penalises transport emissions by one point per 10 kg, capped at 70, with bonuses for low-carbon modes.

### Storage drivers

The service layer talks to a small repository interface. `DATA_DRIVER=mongo` (default) persists to MongoDB; `DATA_DRIVER=memory` keeps everything in process, which the test-suite and local demos use. Both implement identical filtering rules (`booking-api/src/domain/catalogFilters.js`).

## Planner GraphQL additions

```graphql
type Trip {
  # ...existing fields, plus:
  numberOfTravelers: Int
  ecoScore: Int
  bookings(status: BookingStatus): [Booking!]!     # owner only, fetched from the booking API
  bookingSummary: BookingSummary                   # cost and carbon totals of confirmed bookings
  totalCarbonFootprintKgCO2e: Float                # transport + stays + meals
}
```

Booking fields are read-only and visible to the trip owner only. Creating, listing and cancelling bookings goes straight to the booking API, which enforces ownership, so there is a single write path to secure. If the booking API is unreachable the trip still loads; the booking fields return empty and a warning is logged.

### Access rules

| Operation | Who may call it |
|---|---|
| `getTrip` | The creator or a listed traveller; anyone else gets "Trip not found" |
| `getTrips` | Authenticated users; returns only trips they created or travel on |
| `getUserTrips` | Authenticated users; returns trips they created (the id comes from the token) |
| `updateTrip`, `deleteTrip` | The creator only |
| `loginUser` | Anyone; a wrong email and a wrong password return the same "Wrong credentials" error |

## Tests

```bash
cd booking-api && npm test     # node:test + supertest against the in-memory driver
cd client && npm run build     # type/bundle check of the UI
```

## Environment variables

| Variable | Service | Description |
|---|---|---|
| `JWT_SECRET` | server, booking-api | Shared signing secret. Required. |
| `MONGO_URI` | server, booking-api | MongoDB connection string (separate databases) |
| `PORT` | all | Listening port (4000 planner, 5000 booking API) |
| `BOOKING_API_URL` | server | Where the planner reaches the booking API (`http://booking-api:5000` in Compose) |
| `DATA_DRIVER` | booking-api | `mongo` or `memory` |
| `SEED_ON_START` | booking-api | Seed the sample catalogue when empty (`true`) |
| `CORS_ORIGIN` | booking-api | Allowed browser origins, comma separated, or `*` |
| `VITE_GRAPHQL_URL`, `VITE_BOOKING_API_URL` | client | Override the proxied relative API paths |

## Project structure

```
├── client/                 React app (src/pages, src/components, src/api, src/styles)
├── server/                 Planner GraphQL API (Dockerfile + src/)
│   └── src/graphql/        schemas/*.graphql, resolvers/
├── booking-api/            Dedicated booking REST API
│   ├── src/domain/         eco model, catalogue vocabulary, filters
│   ├── src/repositories/   memory/ and mongo/ drivers behind one interface
│   ├── src/services/       availability and booking rules
│   ├── src/routes/         Express routers · src/docs/openapi.js
│   ├── src/data/           sample catalogue and seeding
│   └── test/               API tests
└── docker-compose.yml
```

## License

GNU General Public License v3.0. See [LICENSE](LICENSE).
