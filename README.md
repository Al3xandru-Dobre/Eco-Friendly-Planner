# 🌱 Eco-Friendly Planner

A sustainable travel planning application built with Node.js, GraphQL, and MongoDB.

## 📋 Overview

Eco-Friendly Planner is a web application designed to help users plan environmentally conscious travel itineraries. The application uses a modern tech stack with a GraphQL API backend and MongoDB database.

## 🚀 Features

- GraphQL API for efficient data querying
- MongoDB database for flexible data storage
- Docker containerization for easy deployment
- JWT-based authentication
- Persistent data storage

## 🛠️ Tech Stack

- **Backend**: Node.js with GraphQL
- **Database**: MongoDB 6.0
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT (JSON Web Tokens)

## 📦 Prerequisites

Before running this project, make sure you have the following installed:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js (for local development)

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Al3xandru-Dobre/Eco-Friendly-Planner.git
   cd Eco-Friendly-Planner
   ```

2. **Create environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   JWT_SECRET=your_jwt_secret_here
   ```

3. **Start the application with Docker**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - GraphQL API: `http://localhost:4000`
   - MongoDB: `localhost:27017`

## 🏗️ Project Structure

```
Eco-Friendly-Planner/
├── client/                 # Frontend application
├── server/                 # Backend GraphQL server
│   └── src/               # Server source code
├── docker-compose.yml     # Docker services configuration
├── LICENSE               # GPL-3.0 License
└── README.md            # Project documentation
```

## 🐳 Docker Services

The application uses Docker Compose to orchestrate two main services:

- **server**: Node.js GraphQL API running on port 4000
- **mongo_db**: MongoDB database running on port 27017

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development` |
| `PORT` | Server port | `4000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://mongo_db:27017/eco_travel_planner` |
| `JWT_SECRET` | Secret key for JWT authentication | Required in `.env` |

## 💾 Data Persistence

MongoDB data is persisted using Docker volumes, ensuring your data survives container restarts and removals.

## 🛠️ Development

To work on the project locally:

1. The server code in `./server/src` is mounted as a volume
2. Changes to the source code will be reflected in the container
3. MongoDB can be accessed using tools like [MongoDB Compass](https://www.mongodb.com/products/compass)

## 📝 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Al3xandru-Dobre**

- GitHub: [@Al3xandru-Dobre](https://github.com/Al3xandru-Dobre)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Al3xandru-Dobre/Eco-Friendly-Planner/issues).

## ⭐ Show your support

Give a ⭐️ if this project helped you!

---

Made with 💚 for a sustainable future
