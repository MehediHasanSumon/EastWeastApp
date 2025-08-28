import "flowbite";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import App from "./App.tsx";
import { persistor, store } from "./app/Store.ts";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { UserProvider } from "./context/UserContext.tsx";
import { SocketProvider } from "./context/SocketContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <ThemeProvider>
        <UserProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </UserProvider>
      </ThemeProvider>
    </PersistGate>
  </Provider>
);
