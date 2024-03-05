import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as couponController from "./coupon.controller.js"
import * as couponValidation from "./coupon.validation.js"

import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";

const router = Router();

router.post('/', auth([systemRoles.SUPERADMIN, systemRoles.SELLER]),
    validationMiddleware(couponValidation.addCouponSchema),
    expressAsyncHandler(couponController.addCoupon))

router.get('/', auth([systemRoles.SUPERADMIN]), expressAsyncHandler(couponController.getAllCoupons))

router.get('/single/', auth([systemRoles.SUPERADMIN]), expressAsyncHandler(couponController.getCouponByCode))

router.delete('/:couponId', auth([systemRoles.SUPERADMIN, systemRoles.SELLER]), expressAsyncHandler(couponController.deleteCoupon))

router.put('/:couponId', auth([systemRoles.SUPERADMIN, systemRoles.SELLER]), expressAsyncHandler(couponController.updateCoupon))

router.post('/validateCoupon', auth([systemRoles.USER]), expressAsyncHandler(couponController.validateCoupon))


export default router;