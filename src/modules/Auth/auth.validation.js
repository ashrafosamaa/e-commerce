import Joi from "joi";

export const signUpSchema ={
    body:Joi.object({
        username:Joi.string().min(3).max(10).required().trim(), 
        email:Joi.string().email().required(), 
        password:Joi.string().min(6).max(11).required(), 
        phoneNumbers:Joi.array().required(), 
        addresses:Joi.array().required(), 
        age: Joi.number().required().max(100).min(18),
        role: Joi.string().valid('user', 'seller', 'super-admin').default('User'),
    })
}
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
})
export const updateProfile = Joi.object({
    body:Joi.object({
        username:Joi.string().min(3).max(10).trim(),
        email:Joi.string().email(),
        phoneNumbers:Joi.array(),
        addresses:Joi.array(),
        age:Joi.number().max(100).min(18),
        role: Joi.string().valid('user', 'seller', 'super-admin').default('User'),
    }),
    params: Joi.object({
        userId: Joi.string().length(24).hex().required()
    })
})
export const deleteProfile = Joi.object({
    params: Joi.object({
        userId: Joi.string().length(24).hex().required()
    })
})
export const getProfile = Joi.object({
    params: Joi.object({
        userId: Joi.string().length(24).hex().required()
    })
})