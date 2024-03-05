import { scheduleJob } from "node-schedule"
import {DateTime} from 'luxon'

import Coupon from "../../DB/models/coupon.model.js"
import Order from "../../DB/models/order.model.js"

export function cronToChangeExpiredCoupons(){
    scheduleJob('0 0 0 * * *', async ()=> { 
        console.log('hi every day at 00:00:00 am check coupons')
        const coupons = await Coupon.find({couponStatus: 'valid'})
        for (const coupon of coupons) {
            if(DateTime.fromISO(coupon.toDate) < DateTime.now()){
                coupon.couponStatus = 'expired'
            }
            await coupon.save()
        }
    })
}

export function cronToCancelOrders(){
    scheduleJob('0 0 0 * * *', async ()=> {
        console.log('hi every day at 00:00:00 am check orders')
        const orders = await Order.find({orderStatus: 'Placed'})
        if(!orders.length) return console.log('No orders to cancel')
        // const now = DateTime.utc(); // Current time in UTC
        for (const order of orders) {
            // cancel order after one day from adding it
            if(DateTime.fromISO(order.createdAt) < DateTime.now()){
                console.log(`Order: ${order._id} cancelled.`);
                // order.orderStatus = 'Cancelled'
                // await order.save()
            }
            // await order.save();

            // const createdAt = DateTime.fromISO(order.createdAt, { zone: 'utc' }); // Convert createdAt to UTC
            // const diffInSeconds = now.diff(createdAt, 'seconds').seconds;

            // if (diffInSeconds >= 1) {
            //     console.log(`Order ${order._id} cancelled.`);
            //     order.orderStatus = 'Cancelled';
            // }
            // await order.save();
        }
    })
}