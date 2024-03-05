import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as categoryController from "./category.controller.js"

import {auth} from "../../middlewares/auth.middleware.js"
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { systemRoles } from "../../utils/system-roles.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";

const router = Router();

router.post('/', 
auth([systemRoles.SUPERADMIN]), 
multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'), 
expressAsyncHandler(categoryController.createCategory))

router.put('/:categoryId', 
auth([systemRoles.SUPERADMIN]), 
multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'), 
expressAsyncHandler(categoryController.updateCategory))

router.get('/', expressAsyncHandler(categoryController.getCategoriesSeparately))

router.get('/specific/:categoryId', expressAsyncHandler(categoryController.getCategorieById))

router.get('/sub/:categoryId', expressAsyncHandler(categoryController.getSubInCategory))

router.get('/brands/:categoryId', expressAsyncHandler(categoryController.getBrandsInCategory))

router.get('/products/:categoryId', expressAsyncHandler(categoryController.getProductsInCategory))

router.get('/withSubCategories', expressAsyncHandler(categoryController.getCategoriesWithSub))

router.get('/withSubCategoriesWithBrands', expressAsyncHandler(categoryController.getCategoriesWithSubWithBrand))

router.get('/tillProducts', expressAsyncHandler(categoryController.getCategoriesTillProducts))

router.delete('/:categoryId', auth([systemRoles.SUPERADMIN]), expressAsyncHandler(categoryController.deleteCategory))


export default router;