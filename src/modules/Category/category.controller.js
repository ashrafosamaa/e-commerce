import slugify from "slugify"

import Category from "../../../DB/models/category.model.js"
import SubCategory from "../../../DB/models/sub-category.model.js"
import Brand from "../../../DB/models/brand.model.js"
import cloudinaryConnection from "../../utils/cloudinary.js"
import generateUniqueString from "../../utils/generate-unique-string.js"

export const createCategory = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {name} = req.body
    // check if name duplicate
    const isNameDuplicate = await Category.findOne({ name })
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
        folder: `${process.env.MAIN_FOLDER}/Categories/${folderId}`
    })
    const category = {
        name,
        slug,
        Image: {secure_url, public_id},
        folderId,
        addedBy: _id
    }
    const categoryCreated = (await Category.create(category))
    if (!categoryCreated) {
        await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${folderId}`)
        await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${folderId}`)
        return next(new Error('Error while adding Category', { cause: 500 }))
    }
    res.status(201).json({ success: true, message: 'Category created successfully', data: categoryCreated })
}

export const updateCategory = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {categoryId} = req.params
    const {name, oldPublicId} = req.body
    // check that category is found
    const category = await Category.findById(categoryId)
    if (!category){
        return res.status(404).json({
            msg: "Category not found"
        })
    }
    // check if name duplicate
    if(name){
        if (name == category.name){
            return res.status(400).json({
                msg: "Please try new name"
            })
        }
        const isNameDuplicate = await Category.findOne({ name })
        if(isNameDuplicate){
            return res.status(409).json({
                msg: "Name is already exists, Please try another name"
            })
        }
        category.name = name
        category.slug = slugify(name, '-')
    }
    if(oldPublicId){
        if(!req.file){
            return res.status(400).json({
                msg: "Image is required"
            })
        }
        if(category.Image.public_id != oldPublicId){
            return res.status(400).json({
                msg: "Not correct old image"
            })
        }
        const newPublicId = oldPublicId.split(`${category.folderId}/`)[1]
        const {secure_url, public_id} = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Categories/${category.folderId}`,
            public_id: newPublicId
        })
        category.Image.secure_url = secure_url
    }
    category.updatedBy = _id
    await category.save()
    res.status(200).json({ success: true, message: 'Category updated successfully'})
}

export const getCategoriesSeparately = async (req, res, next)=> {
    const category = await Category.find()
    res.status(200).json({ msg: "Category fetched successfully", data: category })
}

export const getCategoriesWithSub = async (req, res, next)=> {
    const category = await Category.find().populate([ { path: 'subCategories', populate: {path: 'Brands'} } ])
    res.status(200).json({ msg: "Category fetched successfully", data: category })
}

export const deleteCategory = async (req, res, next)=> {
    // destruct data from user
    const {categoryId} = req.params
    // check that category is found and delete
    const category = await Category.findByIdAndDelete(categoryId)
    if(!category){
        return res.status(404).json({
            msg: "Category not found"
        })
    }
    // delete related sub categoris
    const subCategories = await SubCategory.deleteMany({categoryId})
    if(subCategories.deletedCount <= 0){
        console.log("No related Sub Categories to this Category");
    }
    // delete related brands
    const brands = await Brand.deleteMany({categoryId})
    if(brands.deletedCount <= 0){
        console.log("No related Brands to this Category");
    }
    // delete images
    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${category.folderId}`)
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${category.folderId}`)
    // send response
    res.status(200).json({message: 'Category deleted successfully'})
}