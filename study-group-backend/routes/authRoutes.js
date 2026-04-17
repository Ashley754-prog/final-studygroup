import express from 'express';
import { createAccount, login, verifyAccount, checkGoogleAccount, getUserById } from '../controllers/authController.js';

const router = express.Router();

router.post('/', createAccount);
router.post('/login', login);
router.post('/verify', verifyAccount);
router.get("/check-google", checkGoogleAccount);
router.get('/user/:id', getUserById);

export default router;
