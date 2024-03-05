import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as orderController from "./order.controller.js"

import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";

const router = Router();

router.post('/', auth([systemRoles.USER]), expressAsyncHandler(orderController.createOrder))

router.post('/cartToOrder', auth([systemRoles.USER]), expressAsyncHandler(orderController.convertCartToOrder))

router.put('/:orderId', auth([systemRoles.DELIVERY]), expressAsyncHandler(orderController.delieverOrder))





export default router; 