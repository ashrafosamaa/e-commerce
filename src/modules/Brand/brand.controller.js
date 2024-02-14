import slugify from "slugify";

import SubCategory from "../../../DB/models/sub-category.model.js";
import Brand from "../../../DB/models/brand.model.js";
import cloudinaryConnection from "../../utils/cloudinary.js";
import generateUniqueString from "../../utils/generate-unique-string.js";

export const addBrand = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {name} = req.body
    const {categoryId, subCategoryId} = req.query
    // check that subCategory is found
    const subCategory = await SubCategory.findById(subCategoryId).populate('categoryId', 'folderId')
    if (!subCategory){
        return res.status(404).json({
            msg: "Sub Category not found"
        })
    }
    // check that category is found
    if(subCategory.categoryId._id != categoryId){
        return res.status(404).json({
            msg: "Category not found"
        })
    }
    // check if name duplicate in same subCategory
    const isBrandDuplicate = await Brand.findOne({ name, subCategoryId })
    if(isBrandDuplicate){
        return res.status(409).json({
            msg: "Name is already exists in same Sub Category, Please try another name"
        })
    }
    // slug
    const slug = slugify(name, '-')
    //ulpoad logo of brand
    if(!req.file){
        return res.status(400).json({
            msg: "Logo is required"
        })
    }
    const folderId = generateUniqueString(4)
    const {secure_url,public_id} = await cloudinaryConnection().uploader.upload(req.file.path,{
        folder: `${process.env.MAIN_FOLDER}/Categories/${subCategory.categoryId.folderId}/SubCategories/${subCategory.folderId}/Brands/${folderId}`
    })
    const brandObject ={
        name, 
        slug,
        Image: {secure_url, public_id},
        folderId,
        subCategoryId,
        categoryId,
        addedBy: _id
    }
    const newBrand = await Brand.create(brandObject)
    if(!newBrand){
        await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${subCategory.categoryId.folderId}/SubCategories/${subCategory.folderId}/Brands/${folderId}`)
        await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${subCategory.categoryId.folderId}/SubCategories/${subCategory.folderId}/Brands/${folderId}`)
        return res.status(500).json({
            msg: "Something went wrong, Please try again"
        })
    }
    res.status(201).json({
        msg: "Brand added successfully",
        newBrand
    })
}

export const getBrandSeparately = async (req, res, next)=> {
    const subCategory = await Brand.find()
    res.status(200).json({ msg: "Brand fetched successfully", data: subCategory })
}

export const deleteBrand = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {brandId} = req.params
    // check that brand is found and delete
    const deleteBrand = await Brand.findById(brandId).populate([
        {path: 'categoryId', select: 'folderId'}, 
        {path: 'subCategoryId', select: 'folderId'}])
    if(!deleteBrand){
        return res.status(404).json({
            msg: "Brand not found"
        })
    }
    // check that user is owner
    if(deleteBrand.addedBy.toString() != _id.toString() ){
        return res.status(403).json({
            msg: "You are not allowed to delete this brand"
        })
    }
    await deleteBrand.deleteOne()
    // delete related Products

    // const products = await Product.deleteMany({brandId})
    // if(products.deletedCount <= 0){
    //     console.log("No related Products to this Brand");
    // }

    // delete images
    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${deleteBrand.categoryId.folderId}/SubCategories/${deleteBrand.subCategoryId.folderId}/Brands/${deleteBrand.folderId}`)
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${deleteBrand.categoryId.folderId}/SubCategories/${deleteBrand.subCategoryId.folderId}/Brands/${deleteBrand.folderId}`)
    // send response
    res.status(200).json({message: 'Brand deleted successfully'})
}