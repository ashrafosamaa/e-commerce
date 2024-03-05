import { DateTime } from "luxon";
import { qrCodeGeneration } from "../../utils/qr-code.js";
import { applyCouponValidation } from "../../utils/coupon.validation.js"
import { checkProductAvailability } from "../Cart/utils/check-product-in-db.js";

import Product from "../../../DB/models/product.model.js";
import Cart from "../../../DB/models/cart.model.js"
import CouponUser from "../../../DB/models/coupon-user.model.js";
import Order from "../../../DB/models/order.model.js";

export const createOrder = async (req, res ,next) => {
    //destruct data from the user
    const {
        product, 
        quantity,
        couponCode,
        paymentMethod,
        phoneNumbers,
        address,
        city,
        postalCode,
        country
    } = req.body
    const {_id:user} = req.authUser
    // coupon code check
    let coupon = null
    if(couponCode){
        const isCouponValid = await applyCouponValidation(couponCode, user);
        if(isCouponValid.status) return next({message: isCouponValid.msg, cause: isCouponValid.status});
        coupon = isCouponValid;
    }
    // product check
    const isProductAvailable = await checkProductAvailability(product, quantity);
    if(!isProductAvailable) return next({message: 'Product is not available', cause: 400});
    // set orderitems
    let orderItems = [{
        title: isProductAvailable.title,
        quantity,
        price: isProductAvailable.appliedPrice,
        product: isProductAvailable._id
    }]
    // prices calculation
    let shippingPrice = orderItems[0].price * quantity;
    let totalPrice = shippingPrice;
    // coupon calculation
    if(coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice))  return next({message: 'You cannot use this coupon', cause: 400});
    if(coupon?.isFixed){
        totalPrice = shippingPrice - coupon.couponAmount;
    }else if(coupon?.isPercentage){
        totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount / 100);
    }
    // order status + paymentmethod
    let orderStatus;
    if(paymentMethod === 'Cash') orderStatus = 'Placed';
    // create order
    const order = new Order({
        user,
        orderItems,
        shippingAddress: {address, city, postalCode, country},
        phoneNumbers,
        shippingPrice,
        coupon: coupon?._id,
        totalPrice,
        paymentMethod,
        orderStatus
    });
    // save order
    await order.save();
    req.savedDocument = { model: Order, _id: order._id }
    // update product stock
    isProductAvailable.stock -= quantity;
    await isProductAvailable.save();
    // update coupon usage count
    if(coupon){
        await CouponUser.updateOne({couponId:coupon._id, userId:user}, {$inc: {usageCount: 1}});
    }
    // generate QR code
    const orderQR = await qrCodeGeneration([{orderId: order._id, user: order.user, totalPrice: order.totalPrice, orderStatus: order.orderStatus}]);
    res.status(201).json({message: 'Order created successfully', order, orderQR});
}

export const convertCartToOrder = async (req, res, next) => {
        //destruct data from the user
        const {
            couponCode,
            paymentMethod,
            phoneNumbers,
            address,
            city,
            postalCode,
            country
        } = req.body
        const {_id:user} = req.authUser
        // check that cart is found
        const userCart = await Cart.findOne({userId: user});
        if(!userCart) return next({message: 'Cart not found', cause: 404});
        // coupon code check
        let coupon = null
        if(couponCode){
            const isCouponValid = await applyCouponValidation(couponCode, user);
            if(isCouponValid.status) return next({message: isCouponValid.msg, cause: isCouponValid.status});
            coupon = isCouponValid;
        }
        // set orderitems
        let orderItems = userCart.products.map(cartItem=>{
            return{
                title: cartItem.title,
                quantity: cartItem.quantity,
                price: cartItem.basePrice,
                product: cartItem.productId
            }
        })
        // prices calculation
        let shippingPrice = userCart.subTotal;
        let totalPrice = shippingPrice;
        // coupon calculation
        if(coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice))  return next({message: 'You cannot use this coupon', cause: 400});
        if(coupon?.isFixed){
            totalPrice = shippingPrice - coupon.couponAmount;
        }else if(coupon?.isPercentage){
            totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount / 100);
        }
        // order status + paymentmethod
        let orderStatus;
        if(paymentMethod === 'Cash') orderStatus = 'Placed';
        // create order
        const order = new Order({
            user,
            orderItems,
            shippingAddress: {address, city, postalCode, country},
            phoneNumbers,
            shippingPrice,
            coupon: coupon?._id,
            totalPrice,
            paymentMethod,
            orderStatus
        });
        // save order
        await order.save();
        req.savedDocument = { model: Order, _id: order._id }
        // cart delete
        await Cart.findByIdAndDelete({_id: userCart._id});
        // update product stock
        for (const item of orderItems) {
            await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
        }
        // update coupon usage count
        if(coupon){
            await CouponUser.updateOne({couponId:coupon._id, userId: user}, {$inc: {usageCount: 1}});
        }
        // generate QR code
        const orderQR = await qrCodeGeneration([{orderId: order._id, user: order.user, totalPrice: order.totalPrice, orderStatus: order.orderStatus}]);
        res.status(201).json({message: 'Order created successfully', order, orderQR});    
}

export const delieverOrder = async (req, res, next) => {
    // destruct data from the user
    const {orderId}= req.params;
    // check that order is found
    const updateOrder = await Order.findOneAndUpdate({
        _id: orderId,
        orderStatus: {$in: ['Paid','Placed']}
    },{
        orderStatus: 'Delivered',
        deliveredAt: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        deliveredBy: req.authUser._id,
        isDelivered: true
    },{
        new: true
    })
    // check that order is found
    if(!updateOrder) return next({message: 'Order not found or cannot be delivered', cause: 404});
    // send response
    res.status(200).json({message: 'Order delivered successfully', order: updateOrder});
}

