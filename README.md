# Vibe Ant Simulation

An interactive web application that simulates ant colony behavior using React and Firebase.

## 🐜 Project Overview

Vibe Ant Simulation is a web-based simulation of ant colony behavior. The application demonstrates how simple rules followed by individual ants can lead to complex emergent behavior at the colony level. Users can adjust various parameters to observe how they affect the collective behavior of the ants.

## ✨ Features

- Real-time simulation of ant behavior using HTML5 Canvas and React
- Customizable simulation parameters (number of ants, etc.)
- User authentication with Firebase
- Responsive design for desktop and mobile devices
- Intuitive user interface for controlling the simulation

## 🛠️ Technologies Used

- React.js
- React Router
- Firebase (Authentication, Firestore)
- HTML5 Canvas for rendering
- CSS3 for styling

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Firebase account

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/Methodician/vibe-antsim.git
cd vibe-antsim
```

### Install dependencies

```bash
npm install
```

### Configure Firebase

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password) and Firestore in your Firebase project
3. Create a `.env` file in the root directory with your Firebase configuration:

```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Run the application

```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🔧 Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## 🔍 Project Structure

```
vibe-antsim/
├── public/                 # Public assets
├── src/                    # Source files
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── utils/              # Utility functions
│   ├── firebase.js         # Firebase configuration
│   ├── App.js              # Main App component
│   └── index.js            # Entry point
└── .env                    # Environment variables (do not commit this file)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Create React App](https://create-react-app.dev/)
