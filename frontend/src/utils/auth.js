// Tab-specific user data management
const generateTabId = () => {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const loginUser = (user, token) => {
  const tabId = generateTabId();
  
  // Store in both localStorage (persistence) and sessionStorage (tab isolation)
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", token);
  
  sessionStorage.setItem("currentUser", JSON.stringify(user));
  sessionStorage.setItem("currentToken", token);
  sessionStorage.setItem("tabId", tabId);
};

export const logoutUser = () => {
  // Clear both storage mechanisms
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  sessionStorage.clear();
};

export const getToken = () => {
  // Try sessionStorage first (current tab), fallback to localStorage
  return sessionStorage.getItem("currentToken") || localStorage.getItem("token");
};

export const getUser = () => {
  // Try sessionStorage first (current tab), fallback to localStorage
  const sessionUser = sessionStorage.getItem("currentUser");
  if (sessionUser) {
    try {
      return JSON.parse(sessionUser);
    } catch {
      return null;
    }
  }
  
  // Fallback to localStorage
  const localUser = localStorage.getItem("user");
  if (localUser) {
    try {
      return JSON.parse(localUser);
    } catch {
      return null;
    }
  }
  
  return null;
};

export const getUsername = () => {
  const user = getUser();
  return user?.username || "";
};

export const isAuthenticated = () => !!getToken();

// Helper to detect tab changes and validate data consistency
export const validateUserData = () => {
  const sessionUser = sessionStorage.getItem("currentUser");
  const localUser = localStorage.getItem("user");
  
  if (sessionUser && localUser) {
    try {
      const sessionData = JSON.parse(sessionUser);
      const localData = JSON.parse(localUser);
      
      // If IDs don't match, clear sessionStorage and use localStorage
      if (sessionData.id !== localData.id) {
        sessionStorage.removeItem("currentUser");
        sessionStorage.removeItem("currentToken");
        sessionStorage.removeItem("tabId");
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
};
