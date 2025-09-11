# 🌱 Eco-Friendly Travel Planner

A comprehensive web application that helps users plan eco-conscious trips while calculating and minimizing their carbon footprint. Make sustainable travel choices with real-time carbon footprint calculations and eco-friendly recommendations.

## 🚀 Features

### 🌍 Environmental Impact Tracking
- **Carbon Footprint Calculator**: Real-time calculation of CO2 emissions based on transportation choices
- **Eco-Score System**: Intelligent scoring system (0-100) that rates trip sustainability
- **Transportation Comparison**: Compare environmental impact across different travel modes
- **Multi-Traveler Support**: Calculate shared emissions for group travel

### 🗺️ Trip Planning
- **Comprehensive Trip Management**: Create, update, and manage your travel itineraries
- **Destination Planning**: Organize trips with start/end dates and detailed descriptions
- **Accommodation Tracking**: Log eco-friendly accommodation choices
- **Personal Notes**: Add custom notes and observations for each trip

### 👤 User Management
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **User Profiles**: Personal travel history and statistics
- **Social Features**: Share trips with other travelers

### 🚗 Transportation Options
Support for multiple transportation modes with accurate emission factors:
- **🚂 Rail Transport**: Train (including high-efficiency options like Eurostar)
- **🚌 Bus/Coach**: Long-distance and local bus services
- **🚗 Road Vehicles**: 
  - Electric cars (lowest emissions)
  - Hybrid vehicles
  - Gasoline vehicles (small, medium, large)
  - Motorcycles
- **✈️ Air Travel**: Short-haul and long-haul flights
- **⛴️ Ferry**: Foot passenger ferry services
- **🚴 Active Transport**: Bicycles and walking (zero emissions!)

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Web Framework**: Express.js
- **API**: GraphQL with Apollo Server
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) with bcryptjs
- **Environment**: Docker & Docker Compose

### Frontend
- **Framework**: [Frontend framework to be implemented]
- **API Client**: Apollo Client (GraphQL)

### DevOps
- **Containerization**: Docker & Docker Compose
- **Development**: Nodemon for hot reloading

## 🏃‍♂️ Quick Start

### Prerequisites
- Docker and Docker Compose installed on your system
- Node.js 14+ (if running locally without Docker)
- MongoDB (if running locally without Docker)

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Al3xandru-Dobre/Eco-Friendly-Planner.git
   cd Eco-Friendly-Planner
   ```

2. **Create environment variables**
   ```bash
   # Create a .env file in the root directory
   echo "JWT_SECRET=your-super-secret-jwt-key-here" > .env
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - **GraphQL Playground**: http://localhost:4000/graphql
   - **MongoDB**: mongodb://localhost:27017/eco_travel_planner

### Option 2: Local Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/Al3xandru-Dobre/Eco-Friendly-Planner.git
   cd Eco-Friendly-Planner/server/src
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Create .env file in server/src/
   NODE_ENV=development
   PORT=4000
   MONGO_URI=mongodb://localhost:27017/eco_travel_planner
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

3. **Start MongoDB** (if not using Docker)
   ```bash
   mongod
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### GraphQL Endpoint
- **URL**: `http://localhost:4000/graphql`
- **Playground**: Available in development mode

### Authentication
Include JWT token in requests:
```
Authorization: Bearer <your-jwt-token>
```

### Key Mutations

#### User Registration
```graphql
mutation RegisterUser($registerInput: RegisterInput!) {
  registerUser(registerInput: $registerInput) {
    token
    user {
      id
      name
      email
    }
  }
}
```

#### User Login
```graphql
mutation LoginUser($loginInput: LoginInput!) {
  loginUser(loginInput: $loginInput) {
    token
    user {
      id
      name
      email
    }
  }
}
```

#### Create Trip
```graphql
mutation CreateTrip($createTripInput: CreateTripInput!) {
  createTrip(createTripInput: $createTripInput) {
    id
    destination
    carbonFootprintKgCO2e
    ecoScore
    transportationType
  }
}
```

### Key Queries

#### Get User's Trips
```graphql
query GetTrips {
  getTrips {
    id
    destination
    startDate
    endDate
    carbonFootprintKgCO2e
    ecoScore
    transportationType
  }
}
```

#### Get Current User
```graphql
query GetCurrentUser {
  getCurrentUser {
    id
    name
    email
    createdAt
  }
}
```

## 🌱 Carbon Footprint Calculation

The app uses research-based emission factors (kg CO2e per passenger-km):

| Transportation | Emission Factor | Notes |
|---------------|----------------|-------|
| **Walking/Cycling** | 0.000 | Zero direct emissions |
| **Train (Efficient)** | 0.006 | High-efficiency rail (e.g., Eurostar) |
| **Train (National)** | 0.035 | Standard rail services |
| **Ferry (Foot)** | 0.018 | Foot passenger ferry |
| **Bus/Coach** | 0.028 | Long-distance bus |
| **Electric Car** | 0.050 | Depends on energy grid |
| **Motorbike** | 0.100 | Per passenger |
| **Hybrid Car** | 0.120 | Per passenger |
| **Small Gasoline Car** | 0.170 | Per passenger |
| **Medium Gasoline Car** | 0.200 | Per passenger |
| **Plane (Long-haul)** | 0.150 | >1500km flights |
| **Plane (Short-haul)** | 0.250 | <1500km flights |
| **Large Gasoline Car** | 0.280 | Per passenger |

### Eco-Score Calculation
- Base score: 100 points
- Deductions based on carbon footprint
- Bonuses for eco-friendly transport (+10 for train/bus/bike/walk, +5 for electric vehicles)
- Final score: 0-100 (higher is better)

## 🛠️ Development

### Project Structure
```
Eco-Friendly-Planner/
├── server/
│   └── src/
│       ├── config/          # Database configuration
│       ├── graphql/
│       │   ├── resolvers/   # GraphQL resolvers
│       │   └── schemas/     # GraphQL type definitions
│       ├── models/          # Mongoose models
│       ├── services/        # Business logic (carbon calculator)
│       ├── utils/           # Utility functions
│       └── server.js        # Main server file
├── client/                  # Frontend application (to be implemented)
├── docker-compose.yml       # Docker services configuration
├── LICENSE                  # GPL v3 License
└── README.md               # This file
```

### Running Tests
```bash
cd server/src
npm test
```

### Code Style
The project follows standard Node.js conventions with:
- ESLint for code linting
- Mongoose for MongoDB modeling
- GraphQL schema-first approach

### Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `4000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/eco_travel_planner` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |

## 🤝 Contributing

We welcome contributions to make travel more sustainable! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-eco-feature
   ```
3. **Make your changes**
   - Follow existing code style and patterns
   - Add tests for new functionality
   - Update documentation as needed
4. **Test your changes**
   ```bash
   npm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing eco feature"
   ```
6. **Push and create a Pull Request**
   ```bash
   git push origin feature/amazing-eco-feature
   ```

### Contribution Guidelines
- Write clear, descriptive commit messages
- Include tests for new features
- Update documentation for API changes
- Follow existing code patterns and style
- Focus on sustainability and environmental impact

## 🎯 Roadmap

### Short-term Goals
- [ ] Complete frontend implementation
- [ ] Add more transportation options
- [ ] Implement trip sharing features
- [ ] Add carbon offset recommendations

### Long-term Vision
- [ ] AI-powered eco-friendly route suggestions
- [ ] Integration with real-time transit APIs
- [ ] Carbon offset marketplace integration
- [ ] Social features and challenges
- [ ] Mobile applications

## 📄 License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ **Freedom to use**: Use the software for any purpose
- ✅ **Freedom to study**: Examine and modify the source code
- ✅ **Freedom to distribute**: Share the software with others
- ✅ **Freedom to improve**: Distribute your modifications

**Important**: Any derivative works must also be released under GPL v3.0.

## 🙏 Acknowledgments

- Emission factors based on research from DEFRA, EPA, and academic studies
- Inspired by the urgent need for sustainable travel solutions
- Built with modern web technologies for scalability and maintainability

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Al3xandru-Dobre/Eco-Friendly-Planner/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Al3xandru-Dobre/Eco-Friendly-Planner/discussions)

---

**🌍 Together, let's make travel more sustainable, one trip at a time! 🌱**
