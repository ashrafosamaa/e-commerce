import slugify from "slugify"

import Category from "../../../DB/models/category.model.js";
import SubCategory from "../../../DB/models/sub-category.model.js";
import Brand from "../../../DB/models/brand.model.js";
import cloudinaryConnection from "../../utils/cloudinary.js";
import generateUniqueString from "../../utils/generate-unique-string.js";



export const addSubCategory = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {categoryId} = req.params
    const {name} = req.body
    // check that category is found
    const category = await Category.findById(categoryId);
    if (!category) {
        return res.status(404).json({
            msg: "Category not found"
        });
    }
    // check if name duplicate
    const isNameDuplicate = await SubCategory.findOne({ name })
    if (isNameDuplicate){ 
        return res.status(409).json({
            msg: "Name is already exists, Please try another name"
        })
    }
    // slug 
    const slug = slugify(name, '-')
    // upload image
    if(!req.file){
        return res.status(400).json({
            msg: "Image is required"
        })
    }
    const folderId = generateUniqueString(4)
    const {secure_url, public_id} = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Categories/${category.folderId}/SubCategories/${folderId}` 
    })
    const subCategory = {
        name,
        slug,
        Image: {secure_url, public_id},
        folderId,
        addedBy: _id,
        categoryId
    }
    const subCategoryCreated = await SubCategory.create(subCategory)
    if (!subCategoryCreated) {
        await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${category.folderId}/SubCategories/${folderId}`)
        await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${category.folderId}/SubCategories/${folderId}`)
        return next(new Error('Error while adding Sub-Category', { cause: 500 }))
    }
    res.status(201).json({ success: true, message: 'Sub-Category created successfully', data: subCategoryCreated })
}

export const getSubCategoriesSeparately = async (req, res, next)=> {
    const subCategory = await SubCategory.find()
    res.status(200).json({ msg: "Sub Category fetched successfully", data: subCategory })
}

export const getSubCategoriesWithBrand = async (req, res, next)=> {
    const subCategory = await SubCategory.find().populate('Brands')
    res.status(200).json({ msg: "Sub Category fetched successfully", data: subCategory })
}

export const updateSubCategory = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {subCategoryId, categoryId} = req.query
    const {name, oldPublicId} = req.body
    // check that subCategory is found
    const subCategory = await SubCategory.findById(subCategoryId)
    if (!subCategory){
        return res.status(404).json({
            msg: "Sub Category not found"
        })
    }
    // check that category is found
    if(subCategory.categoryId != categoryId){
        return res.status(404).json({
            msg: "Category not found"
        })
    }
    // check if name duplicate
    if(name){
        if (name == subCategory.name){
            return res.status(400).json({
                msg: "Please try new name"
            })
        }
        const isNameDuplicate = await SubCategory.findOne({ name })
        if(isNameDuplicate){
            return res.status(409).json({
                msg: "Name is already exists, Please try another name"
            })
        }
        subCategory.name = name
        subCategory.slug = slugify(name, '-')
    }
    if(oldPublicId){
        if(!req.file){
            return res.status(400).json({
                msg: "Image is required"
            })
        }
        if(subCategory.Image.public_id != oldPublicId){
            return res.status(400).json({
                msg: "Not correct old image"
            })
        }
        const category = await Category.findById(categoryId)
        const newPublicId = oldPublicId.split(`${subCategory.folderId}/`)[1]
        const {secure_url, public_id} = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Categories/${category.folderId}/SubCategories/${subCategory.folderId}`,
            public_id: newPublicId
        })
        subCategory.Image.secure_url = secure_url
    }
    subCategory.updatedBy = _id
    await subCategory.save()
    res.status(200).json({ success: true, message: 'Sub Category updated successfully'})
}

export const deleteSubCategory = async (req, res, next)=> {
    // destruct data from user
    const {subCategoryId} = req.params
    // check that subCategory is found and delete
    const subCategory = await SubCategory.findByIdAndDelete(subCategoryId).populate('categoryId', 'folderId')
    if(!subCategory){
        return res.status(404).json({
            msg: "Sub Category not found"
        })
    }
    // delete related brands
    const brands = await Brand.deleteMany({subCategoryId})
    if(brands.deletedCount <= 0){
        console.log("No related Brands to this Sub Category");
    }
    // delete images
    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${subCategory.categoryId.folderId}/SubCategories/${subCategory.folderId}`)
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${subCategory.categoryId.folderId}/SubCategories/${subCategory.folderId}`)
    // send response
    res.status(200).json({message: 'Sub Category deleted successfully'})
}