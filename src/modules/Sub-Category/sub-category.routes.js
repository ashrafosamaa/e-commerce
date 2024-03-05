import { Router } from "express";
import expressAsyncHandler from "express-async-handler";

import * as SubCategoryController from "./sub-category.controller.js"

import {auth} from "../../middlewares/auth.middleware.js"
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { systemRoles } from "../../utils/system-roles.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";

const router = Router();

router.post('/:categoryId', 
auth([systemRoles.SUPERADMIN]), 
multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'), 
expressAsyncHandler(SubCategoryController.addSubCategory))

router.put('/', 
auth([systemRoles.SUPERADMIN]), 
multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'), 
expressAsyncHandler(SubCategoryController.updateSubCategory))

router.get('/', expressAsyncHandler(SubCategoryController.getSubCategoriesSeparately))

router.get('/specific/:subCategoryId', expressAsyncHandler(SubCategoryController.getSubCategoryById))

router.get('/brands/:subCategoryId', expressAsyncHandler(SubCategoryController.getBrandsInSubCategory))

router.get('/products/:subCategoryId', expressAsyncHandler(SubCategoryController.getProductsInSubCategory))

router.get('/withBrands', expressAsyncHandler(SubCategoryController.getSubCategoriesWithBrand))

router.get('/tillProducts', expressAsyncHandler(SubCategoryController.getSubCategoriesTillProducts))

router.delete('/:subCategoryId', auth([systemRoles.SUPERADMIN]), expressAsyncHandler(SubCategoryController.deleteSubCategory))


export default router;