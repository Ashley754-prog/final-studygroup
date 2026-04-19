export const loginUser = (user, token) => {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", token);
};

export const logoutUser = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

export const getToken = () => localStorage.getItem("token");

export const getUser = () => {
  try {
    const user = localStorage.getItem("user");
    if (!user) return null;
    
    const parsedUser = JSON.parse(user);
    if (!parsedUser || !parsedUser.id) {
      console.error("Invalid user data found, clearing");
      logoutUser();
      return null;
    }
    
    return parsedUser;
  } catch (error) {
    console.error("Error parsing user data:", error);
    logoutUser();
    return null;
  }
};

export const validateUserSession = () => {
  const user = getUser();
  if (!user) {
    console.error("No user session found");
    return false;
  }
  
  // Additional validation can be added here
  if (!user.id || !user.username) {
    console.error("Invalid user session structure");
    logoutUser();
    return false;
  }
  
  return true;
};

export const getUsername = () => {
  const user = getUser();
  return user?.username || "";
};

export const isAuthenticated = () => !!getToken();
