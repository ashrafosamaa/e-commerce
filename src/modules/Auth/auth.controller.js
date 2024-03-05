import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import User from "../../../DB/models/user.model.js"
import sendEmailService from "../services/send-email.service.js"

export const signUp = async (req, res, next)=> {
    // destruct data from req.body
    const{
        username,
        email,
        password,
        phoneNumbers,
        addresses,
        role,
        age,
    } = req.body
    // check if user already exists
    const isEmailExist = await User.findOne({email})
    if(isEmailExist){
        return res.status(409).json({
            msg: "Email is already exists, Please try another email"
        })
    }
    // password hashing
    const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)
    // create new document in database
    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        phoneNumbers,
        addresses,
        role,
        age
    })
    //generate token
    const userToken = jwt.sign({email}, process.env.JWT_SECRET_VERFICATION, {expiresIn: "2m"})
    // send email
    const isEmailSent = await sendEmailService({
        to: email,
        subject: "Welcome To E-commerce",
        message: `<h4>Click the link below to verify your email</h4>
        <a href="${req.protocol}://${req.headers.host}/auth/verify-email?token=${userToken}">Verify your account</a>`,
    })
    //check email is sent or not
    if(!isEmailSent){
        return res.status(500).json({
            msg: "Failed to send email, Please try again later"
        })
    }
    // send response
    res.status(201).json({
        msg: "User created successfully, Please check your email to verify your account" 
    })
}

export const verifyEmail = async (req, res, next)=> {
    const { token } = req.query
    if(!token){
        return res.status(400).json({
            msg: "Please provide a token"
        })
    }
    // verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_VERFICATION)
    //get user by email , isEmailVerified: false
    const user = await User.findOne({email: decodedToken.email})
    if(!user){
        return res.status(404).json({
            msg: "User not found"
        })
    }
    if(user.isEmailVerified){
        return res.status(400).json({
            msg: "User already verified"
        })
    }
    // update user
    user.isEmailVerified = true
    await user.save()
    // send response
    res.status(200).json({
        msg: "User verified successfully, Please try to login",
        user
    })
}

export const singIn = async (req, res, next)=> {
    //destruct data from req.body
    const{email, password} = req.body
    // check if user exists
    const user = await User.findOne({email})
    if(!user){
        return res.status(404).json({
            msg: "Invalid login credentails"
        })
    }
    const isVerifiedEmail = user.isEmailVerified
    if(!isVerifiedEmail){
        return res.status(404).json({
            msg: "Please Verify your account first"
        })
    }
    // compare password
    const isPasswordMatch = bcrypt.compareSync(password, user.password);
    if (!isPasswordMatch) {
        return res.status(400).json({
            msg: "Invalid login credentials"
        });
    }
    // generate token
    const userToken = jwt.sign({ id: user._id ,email , username: user.username }, 
        process.env.JWT_SECRET_LOGIN, 
        {
            expiresIn: "1d"
        }
    )
    user.isLoggedIn = true
    await user.save()
    // send response
    res.status(200).json({
        msg: "User logged in successfully",
        userToken,
    })
}

export const updateProfileData = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {userId} = req.params
    const{ 
        username,
        email,
        phoneNumbers,
        addresses,
        age,
    } = req.body
    // check who is login and who is updating
    if(_id != userId){
        return res.status(400).json({msg: "You cannot update this profile's data"})
    }
    // check if email duplicate
    const isEmailDuplicate = await User.findOne({ email, _id: { $ne: _id } })
    if (isEmailDuplicate) {
        return res.status(409).json({
            msg: "Email is already exists, Please try another email"
        })
    }
    // update user data
    const updateUser = await User.findByIdAndUpdate(_id, {
        username,
        email,
        phoneNumbers,
        addresses,
        age,
    }, {new: true}).select("-password -_id -createdAt -updatedAt -__v -isLoggedIn -isEmailVerified")
    // send email
    const isEmailSent = await sendEmailService({
        to: updateUser.email,
        subject: "Welcome To E-commerce",
        message: '<h4>Your account data has been updated successfully</h4>'
    })
    if (!updateUser && !isEmailSent) {
        return res.status(404).json({
            msg: "Update failed"
        })
    }
    // send response
    res.status(200).json({
        msg: "User data updated successfully",
        updateUser
    })
}

export const updatePassword = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {userId} = req.params
    const {password, oldPassword} = req.body
    if(_id != userId){
        return res.status(400).json({msg: "You cannot update this profile's data"})
    }
    // hash password
    const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)
    // find user
    const user = await User.findById(_id)
    // check old password
    const isPasswordMatch = bcrypt.compareSync(oldPassword, user.password)
    if(!isPasswordMatch){
        return res.status(400).json({
            msg: "Invalid old password"
        })
    }
    // update user data
    user.password = hashedPassword
    await user.save()
    // send email
    const isEmailSent = await sendEmailService({
        to: user.email,
        subject: "Welcome To E-commerce",
        message: '<h4>Your password has been updated successfully</h4>'
    })
    if (!isEmailSent) {
        return res.status(404).json({
            msg: "Update password failed"
        })
    }
    // send response
    res.status(200).json({
        msg: "User password updated successfully",
        user
    })
}

export const deleteAccount = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {email} = req.authUser
    const {userId} = req.params
    if(_id != userId){
        return res.status(400).json({msg: "You cannot delete this profile"})
    }
    // delete user data
    const deleteUser = await User.findByIdAndDelete(_id)
    // send email
    const isEmailSent = await sendEmailService({
        to: email,
        subject: "Welcome To E-commerce",
        message: '<h4>Your account has been deleted successfully</h4>'
    })
    if (deleteUser.deletedCount == 0 && !isEmailSent) {
        return res.status(404).json({
            msg: "Delete failed"
        })
    }
    // send response
    res.status(200).json({
        msg: "User deleted successfully",
    })
}

export const getAccountData = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {userId} = req.params
    if(_id != userId){
        return res.status(400).json({msg: "You cannot get this profile data"})
    }
    // get user data
    const getUser = await User.findById(_id).select("-password -_id -createdAt -updatedAt -__v -isLoggedIn -isEmailVerified")
    if (!getUser) {
        return res.status(404).json({
            msg: "User not found"
        })
    }
    // send response
    res.status(200).json({
        msg: "User data fetched successfully",
        getUser
    })
}