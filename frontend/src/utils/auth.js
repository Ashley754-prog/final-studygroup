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
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getUsername = () => {
  const user = getUser();
  return user?.username || "";
};

export const isAuthenticated = () => !!getToken();
