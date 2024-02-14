import { Router } from "express";
import * as authController from './auth.controller.js'
import { systemRoles } from "../../utils/system-roles.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import { signUpSchema } from "./auth.validation.js";
import { loginSchema } from "./auth.validation.js";
import { updateProfile } from "./auth.validation.js";
import { deleteProfile } from "./auth.validation.js";
import { getProfile } from "./auth.validation.js";

const router = Router();

router.post('/', validationMiddleware(signUpSchema), authController.signUp)

router.post('/login', validationMiddleware(loginSchema), authController.singIn)

router.get('/verify-email', authController.verifyEmail)  

router.put('/:userId', validationMiddleware(updateProfile), auth([systemRoles.USER, systemRoles.SELLER]), authController.updateProfileData)

router.patch('/:userId', auth([systemRoles.USER, systemRoles.SELLER]), authController.updatePassword)

router.delete('/:userId', validationMiddleware(deleteProfile), auth([systemRoles.USER, systemRoles.SELLER]), authController.deleteAccount)

router.get('/account/:userId', validationMiddleware(getProfile), auth([systemRoles.USER, systemRoles.SELLER]), authController.getAccountData)

export default router;