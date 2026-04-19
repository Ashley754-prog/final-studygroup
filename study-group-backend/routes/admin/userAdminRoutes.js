import express from "express";
import {
  getAdminUserList,
  toggleAdminRole,
  deleteUserById,
  restoreUser
} from "../../controllers/admin/userAdminController.js";

const router = express.Router();

router.get("/admin-list", getAdminUserList);
router.patch("/toggle-admin/:id", toggleAdminRole);
router.delete("/delete/:id", deleteUserById);
router.put("/restore/:id", restoreUser);

export default router;
