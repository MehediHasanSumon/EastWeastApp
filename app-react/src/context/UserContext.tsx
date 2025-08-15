import { createContext, useState, useContext } from "react";

type User = {
  name: string;
  designation: string;
  email: string;
  theme: string;
  profilePicture: string;
};

type UserContextType = {
  user: User;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  handleSaveProfile: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleThemeChange: (theme: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>({
    name: "John Doe",
    designation: "Software Engineer",
    email: "john.doe@example.com",
    theme: "light",
    profilePicture: "https://randomuser.me/api/portraits/men/1.jpg",
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleThemeChange = (theme: string) => {
    setUser((prev) => ({ ...prev, theme }));
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    console.log("Updated profile:", user);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isEditing,
        setIsEditing,
        handleSaveProfile,
        handleInputChange,
        handleThemeChange,
      }}
    >
      <div className={user.theme === "dark" ? "dark" : ""}>{children}</div>
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
