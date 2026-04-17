import express from "express";
import { 
  getAdminProfile, 
  updateAdminProfile, 
  updateAdminPassword 
} from "../../controllers/admin/adminSettingsController.js";

const router = express.Router();

// GET admin profile
router.get("/profile/:id", getAdminProfile);

// UPDATE admin profile
router.put("/profile/:id", updateAdminProfile);

// UPDATE admin password
router.put("/password/:id", updateAdminPassword);

export default router;
