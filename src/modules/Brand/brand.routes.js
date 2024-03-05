import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as brandController from "./brand.controller.js"

import {auth} from "../../middlewares/auth.middleware.js"
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { systemRoles } from "../../utils/system-roles.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";

const router = Router();

router.post('/', auth([systemRoles.SELLER]), multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
expressAsyncHandler(brandController.addBrand))

router.put('/:brandId', auth([systemRoles.SELLER]), multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
expressAsyncHandler(brandController.updateBrand))

router.get('/', expressAsyncHandler(brandController.getBrandSeparately))

router.get('/specific/:brandId', expressAsyncHandler(brandController.getBrandById))

router.get('/products/:brandId', expressAsyncHandler(brandController.getProductsInBrand))

router.get('/tillProducts', expressAsyncHandler(brandController.getBrandWithProducts))

router.delete('/:brandId', auth([systemRoles.SELLER]), expressAsyncHandler(brandController.deleteBrand))


export default router;