import { Navigate } from "react-router-dom";

export default function AdminPrivateRoute({ children }) {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdminLoggedIn = storedUser.is_admin === 1 || storedUser.is_admin === true;

  console.log("AdminPrivateRoute check - storedUser:", storedUser);
  console.log("AdminPrivateRoute check - isAdminLoggedIn:", isAdminLoggedIn);

  return isAdminLoggedIn ? children : <Navigate to="/login" replace />;
}
