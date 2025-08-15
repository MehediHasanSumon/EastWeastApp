# EastWestApp

A full-stack application with web and mobile interfaces for authentication and messaging.

## Project Structure

This project consists of three main components:

1. **app-react**: Web frontend built with React and Vite
2. **app-server**: Backend API server built with Node.js and Express
3. **my-expo-app**: Mobile application built with React Native and Expo

## Technologies Used

### Frontend (app-react)
- React 19
- Redux Toolkit for state management
- Socket.io for real-time communication
- TailwindCSS for styling
- TypeScript for type safety

### Backend (app-server)
- Node.js with Express
- MongoDB with Mongoose for database
- Socket.io for real-time communication
- JWT for authentication
- Multer for file uploads
- TypeScript for type safety

### Mobile (my-expo-app)
- React Native with Expo
- Redux Toolkit for state management
- NativeWind for styling
- React Navigation for routing
- Expo modules for device features

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB instance
- Expo CLI (for mobile development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MehediHasanSumon/EastWeastApp.git
   cd EastWeastApp
   ```

2. Install dependencies for each component:

   **Backend:**
   ```bash
   cd app-server
   npm install
   ```

   **Web Frontend:**
   ```bash
   cd app-react
   npm install
   ```

   **Mobile App:**
   ```bash
   cd my-expo-app
   npm install
   ```

3. Configure environment variables:
   - Create `.env` files in both `app-server` and `app-react` directories based on the provided examples

### Running the Application

**Backend Server:**
```bash
cd app-server
npm run dev
```

**Web Frontend:**
```bash
cd app-react
npm run dev
```

**Mobile App:**
```bash
cd my-expo-app
npm start
```

## Features

- User authentication (login, register, password reset)
- Real-time messaging
- File sharing
- User profiles
- Group conversations
- Mobile-responsive design
- Cross-platform mobile application

## Deployment

### Backend
```bash
cd app-server
npm run build
npm start
```

### Web Frontend
```bash
cd app-react
npm run build
```

### Mobile App
```bash
cd my-expo-app
exp build:android  # For Android
exp build:ios      # For iOS
```

## License

This project is licensed under the ISC License

## Author

Md Mehedi Hasan