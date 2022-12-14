const Coupon = require('../models/couponModel');
const validateMongoDbId = require('../utils/validateMongodbId');
const asynHandler = require('express-async-handler');

/** 新增优惠卷 */
const createCoupon = asynHandler(async (req, res) => {
	try {
		const newCoupon = await Coupon.create(req.body);

		res.json(newCoupon);
	} catch (error) {
		throw new Error(error);
	}
});

/** 查询所有优惠卷 */
const getAllCoupons = asynHandler(async (req, res) => {
	try {
		const coupons = await Coupon.find();

		res.json(coupons);
	} catch (error) {
		throw new Error(error);
	}
});

/** 更改优惠卷 */
const updateCoupon = asynHandler(async (req, res) => {
	const { id } = req.params;

	validateMongoDbId(id);

	try {
		const updateCoupon = await Coupon.findByIdAndUpdate(id, req.body, {
			new: true,
		});

		res.json(updateCoupon);
	} catch (error) {
		throw new Error(error);
	}
});

/** 删除优惠卷 */
const deleteCoupon = asynHandler(async (req, res) => {
	const { id } = req.params;

	validateMongoDbId(id);

	try {
		const deleteCoupon = await Coupon.findByIdAndDelete(id);

		res.json(deleteCoupon);
	} catch (error) {
		throw new Error(error);
	}
});
module.exports = { createCoupon, getAllCoupons, updateCoupon, deleteCoupon };
