import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as productController from "./product.controller.js"

import { auth } from "../../middlewares/auth.middleware.js";
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { systemRoles } from "../../utils/system-roles.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";

const router = Router();

router.post('/', auth([systemRoles.SELLER]), multerMiddleHost({
    extensions: allowedExtensions.image
}).array('images', 3),
expressAsyncHandler(productController.addProduct))

router.put('/:productId', auth([systemRoles.SELLER, systemRoles.SUPERADMIN]), multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
expressAsyncHandler(productController.updateProduct))

router.get('/', productController.getAllProducts)

router.get('/search', productController.searchProduct)

router.get('/filter', productController.filterProduct)

router.get('/byId/:productId', productController.getSpecProduct)

router.delete('/:productId', auth([systemRoles.SELLER, systemRoles.SUPERADMIN]), productController.deleteProduct)


export default router;