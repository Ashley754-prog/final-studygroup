export const loginUser = (user, token) => {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", token);
  localStorage.setItem("userSessionTimestamp", Date.now().toString());
};

export const logoutUser = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("userSessionTimestamp");
  
  // Clear tab-specific data
  sessionStorage.removeItem("tabUser");
  sessionStorage.removeItem("tabId");
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
    
    // Validate session timestamp to prevent stale data
    const sessionTimestamp = localStorage.getItem("userSessionTimestamp");
    
    if (sessionTimestamp) {
      const sessionAge = Date.now() - parseInt(sessionTimestamp);
      const maxSessionAge = 10 * 60 * 1000; // 10 minutes
      
      if (sessionAge > maxSessionAge) {
        console.log("Session expired, clearing data");
        logoutUser();
        return null;
      }
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

export const refreshSession = () => {
  const user = getUser();
  if (user) {
    localStorage.setItem("userSessionTimestamp", Date.now().toString());
  }
};

export const isSessionExpired = () => {
  const sessionTimestamp = localStorage.getItem("userSessionTimestamp");
  if (!sessionTimestamp) return true;
  
  const sessionAge = Date.now() - parseInt(sessionTimestamp);
  const maxSessionAge = 5 * 60 * 1000; // 5 minutes
  
  return sessionAge > maxSessionAge;
};
