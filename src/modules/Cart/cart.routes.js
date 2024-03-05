import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as cartController from "./cart.controller.js"

import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";

const router = Router();

router.get('/', auth([systemRoles.USER]), expressAsyncHandler(cartController.getCart))

router.post('/', auth([systemRoles.USER]), expressAsyncHandler(cartController.addProductToCart))

router.put('/:productId', auth([systemRoles.USER]), expressAsyncHandler(cartController.removeProductFromCart))

router.delete('/:cartId', auth([systemRoles.USER]), expressAsyncHandler(cartController.deleteCart))


export default router;