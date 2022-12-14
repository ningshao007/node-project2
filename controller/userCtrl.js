const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Coupon = require('../models/couponModel');
const Order = require('../models/orderModel');
const uniqid = require('uniqid');

const asyncHandler = require('express-async-handler');
const { generateToken } = require('../config/jwtToken');
const validateMongoDbId = require('../utils/validateMongodbId');
const { generateRefreshToken } = require('../config/refreshtoken');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sendEmail = require('./emailCtrl');

/** 创建用户 */
const createUser = asyncHandler(async (req, res) => {
	const email = req.body.email;
	const findUser = await User.findOne({ email: email });

	if (!findUser) {
		const newUser = await User.create(req.body);
		res.json(newUser);
	} else {
		throw new Error('User Already Exists');
	}
});

/** 忘记密码 */
const forgotPasswordToken = asyncHandler(async (req, res) => {
	const { email } = req.body;
	const user = await User.findOne({ email });

	if (!user) throw new Error('User not found with this email');

	try {
		const token = await user.createPasswordResetToken();

		await user.save();

		const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:5000/api/user/reset-password/${token}'>Click Here</>`;
		const data = {
			to: email,
			text: 'Hey User',
			subject: 'Forgot Password Link',
			htm: resetURL,
		};

		sendEmail(data);

		res.json(token);
	} catch (error) {
		throw new Error(error);
	}
});

/** 重置密码 */
const resetPassword = asyncHandler(async (req, res) => {
	const { password } = req.body;
	const { token } = req.params;

	const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() },
	});

	if (!user) throw new Error(' Token Expired, Please try again later');

	user.password = password;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;

	await user.save();

	res.json(user);
});

/** 用户登录 */
const loginUserCtrl = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	const findUser = await User.findOne({ email });

	if (findUser && (await findUser.isPasswordMatched(password))) {
		const refreshToken = await generateRefreshToken(findUser?._id);

		/** 返回浏览器cookie */
		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			maxAge: 72 * 60 * 60 * 1000,
		});

		res.json({
			_id: findUser?._id,
			firstname: findUser?.firstname,
			lastname: findUser?.lastname,
			email: findUser?.email,
			mobile: findUser?.mobile,
			token: generateToken(findUser?._id),
		});
	} else {
		throw new Error('Invalid Credentials');
	}
});

/** 管理员登录,TODO: 感觉这个接口应该和上面的用户登录接口合并在一起 */
const loginAdmin = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	const findAdmin = await User.findOne({ email });

	if (findAdmin.role !== 'admin') throw new Error('Not Authorization');
	if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
		const refreshToken = await generateRefreshToken(findAdmin?._id);
		// const updateUser = await User.findByIdAndUpdate(
		// 	findAdmin.id,
		// 	{
		// 		refreshToken: refreshToken,
		// 	},
		// 	{ new: true },
		// );
		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			maxAge: 72 * 60 * 60 * 1000,
		});

		res.json({
			_id: findAdmin?._id,
			firstname: findAdmin?.firstname,
			lastname: findAdmin?.lastname,
			email: findAdmin?.email,
			mobile: findAdmin?.mobile,
			token: generateToken(findAdmin?._id),
		});
	} else {
		throw new Error('Invalid Credentials');
	}
});

/** 重新生成accessToken */
const handleRefreshToken = asyncHandler(async (req, res) => {
	const cookie = req.cookies;

	if (!cookie?.refreshToken) throw new Error('No Refresh Token in Cookies');

	const refreshToken = cookie.refreshToken;

	const user = await User.findOne({ refreshToken });

	if (!user) throw new Error(' No Refresh token present in db or not matched');

	jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
		if (err || user.id !== decoded.id) {
			throw new Error('There is something wrong with refresh token');
		}
		const accessToken = generateToken(user?._id);

		res.json({ accessToken });
	});
});

const logout = asyncHandler(async (req, res) => {
	const cookie = req.cookies;

	if (!cookie?.refreshToken) throw new Error('No Refresh Token in Cookies');

	const refreshToken = cookie.refreshToken;
	const user = await User.findOne({ refreshToken });

	if (!user) {
		res.clearCookie('refreshToken', {
			httpOnly: true,
			secure: true,
		});

		return res.sendStatus(204);
	}

	await User.findOneAndUpdate(refreshToken, {
		refreshToken: '',
	});

	res.clearCookie('refreshToken', {
		httpOnly: true,
		secure: true,
	});

	res.sendStatus(204);
});

/** 更新用户信息 */
const updatedUser = asyncHandler(async (req, res) => {
	const { _id } = req.user;

	validateMongoDbId(_id);

	try {
		const updatedUser = await User.findByIdAndUpdate(
			_id,
			{
				firstname: req?.body?.firstname,
				lastname: req?.body?.lastname,
				email: req?.body?.email,
				mobile: req?.body?.mobile,
			},
			{
				new: true,
			},
		);

		res.json(updatedUser);
	} catch (error) {
		throw new Error(error);
	}
});

/** 保存用户地址信息 */
const saveAddress = asyncHandler(async (req, res, next) => {
	const { _id } = req.user;

	validateMongoDbId(_id);

	try {
		const updatedUser = await User.findByIdAndUpdate(
			_id,
			{
				address: req?.body?.address,
			},
			{
				new: true,
			},
		);

		res.json(updatedUser);
	} catch (error) {
		throw new Error(error);
	}
});

/** 查询所有用户信息 */
const getallUser = asyncHandler(async (req, res) => {
	try {
		const getUsers = await User.find().populate('wishlist');

		res.json(getUsers);
	} catch (error) {
		throw new Error(error);
	}
});

/** 查询用户信息 */
const getaUser = asyncHandler(async (req, res) => {
	const { id } = req.params;

	validateMongoDbId(id);

	try {
		const getaUser = await User.findById(id);

		res.json({
			getaUser,
		});
	} catch (error) {
		throw new Error(error);
	}
});

/** 删除用户 */
const deleteaUser = asyncHandler(async (req, res) => {
	const { id } = req.params;

	validateMongoDbId(id);

	try {
		const deleteaUser = await User.findByIdAndDelete(id);

		res.json({
			deleteaUser,
		});
	} catch (error) {
		throw new Error(error);
	}
});

/** 拦截用户 */
const blockUser = asyncHandler(async (req, res) => {
	const { id } = req.params;

	validateMongoDbId(id);

	try {
		const blockusr = await User.findByIdAndUpdate(
			id,
			{
				isBlocked: true,
			},
			{
				new: true,
			},
		);

		res.json(blockusr);
	} catch (error) {
		throw new Error(error);
	}
});

/** 解除拦截用户 */
const unblockUser = asyncHandler(async (req, res) => {
	const { id } = req.params;

	validateMongoDbId(id);

	try {
		const unblock = await User.findByIdAndUpdate(
			id,
			{
				isBlocked: false,
			},
			{
				new: true,
			},
		);

		res.json({
			message: 'User UnBlocked',
		});
	} catch (error) {
		throw new Error(error);
	}
});

/** 更新密码 */
const updatePassword = asyncHandler(async (req, res) => {
	const { _id } = req.user;
	const { password } = req.body;

	validateMongoDbId(_id);

	const user = await User.findById(_id);

	if (password) {
		user.password = password;
		const updatedPassword = await user.save();

		res.json(updatedPassword);
	} else {
		res.json(user);
	}
});

const getWishlist = asyncHandler(async (req, res) => {
	const { _id } = req.user;
	try {
		const findUser = await User.findById(_id).populate('wishlist');
		res.json(findUser);
	} catch (error) {
		throw new Error(error);
	}
});

/** 新建购物车 */
const userCart = asyncHandler(async (req, res) => {
	const cart = req.body.cart;
	const { _id } = req.user;

	validateMongoDbId(_id);

	try {
		let products = [];

		const user = await User.findById(_id);
		const alreadyExistCart = await Cart.findOne({ orderby: user._id });

		if (alreadyExistCart) {
			alreadyExistCart.remove();
		}

		for (let i = 0; i < cart.length; i++) {
			let object = {};

			object.product = cart[i]._id;
			object.count = cart[i].count;
			object.color = cart[i].color;

			let getPrice = await Product.findById(cart[i]._id).select('price').exec();

			object.price = getPrice.price;

			products.push(object);
		}

		let cartTotal = 0;

		for (let i = 0; i < products.length; i++) {
			cartTotal = cartTotal + products[i].price * products[i].count;
		}

		let newCart = await new Cart({
			products,
			cartTotal,
			orderby: user?._id,
		}).save();

		res.json(newCart);
	} catch (error) {
		throw new Error(error);
	}
});

/** 查看用户购物车 */
const getUserCart = asyncHandler(async (req, res) => {
	const { _id } = req.user;

	validateMongoDbId(_id);

	try {
		const cart = await Cart.findOne({ orderby: _id }).populate('products.product');

		res.json(cart);
	} catch (error) {
		throw new Error(error);
	}
});

/** 清空购物车 */
const emptyCart = asyncHandler(async (req, res) => {
	const { _id } = req.user;

	validateMongoDbId(_id);

	try {
		// const user = await User.findOne({ _id });
		const cart = await Cart.findOneAndRemove({ orderby: _id });

		res.json(cart);
	} catch (error) {
		throw new Error(error);
	}
});

/** 使用优惠卷 */
const applyCoupon = asyncHandler(async (req, res) => {
	const { coupon } = req.body;
	const user = req.user;

	validateMongoDbId(_id);

	const validCoupon = await Coupon.findOne({ name: coupon });

	if (validCoupon === null) {
		throw new Error('Invalid Coupon');
	}

	let { cartTotal } = await Cart.findOne({
		orderby: user._id,
	}).populate('products.product');

	let totalAfterDiscount = (cartTotal - (cartTotal * validCoupon.discount) / 100).toFixed(2);

	await Cart.findOneAndUpdate({ orderby: user._id }, { totalAfterDiscount }, { new: true });

	res.json(totalAfterDiscount);
});

/** 创建订单 */
const createOrder = asyncHandler(async (req, res) => {
	const { COD, couponApplied } = req.body;
	const user = req.user;

	const { _id } = req.user;

	validateMongoDbId(_id);

	try {
		if (!COD) throw new Error('Create cash order failed');

		let userCart = await Cart.findOne({ orderby: user._id });

		let finalAmount = 0;

		if (couponApplied && userCart.totalAfterDiscount) {
			finalAmount = userCart.totalAfterDiscount;
		} else {
			finalAmount = userCart.cartTotal;
		}

		await new Order({
			products: userCart.products,
			paymentIntent: {
				id: uniqid(),
				method: 'COD',
				amount: finalAmount,
				status: 'Cash on Delivery',
				created: Date.now(),
				currency: 'usd',
			},
			orderby: user._id,
			orderStatus: 'Cash on Delivery',
		}).save();
		let update = userCart.products.map((item) => {
			return {
				updateOne: {
					filter: { _id: item.product._id },
					update: { $inc: { quantity: -item.count, sold: +item.count } },
				},
			};
		});
		await Product.bulkWrite(update, {});

		res.json({ message: 'success' });
	} catch (error) {
		throw new Error(error);
	}
});

/** 查询订单 */
const getOrders = asyncHandler(async (req, res) => {
	const { _id } = req.user;

	validateMongoDbId(_id);

	try {
		const userOrders = await Order.findOne({ orderby: _id }).populate('products.product').exec();

		res.json(userOrders);
	} catch (error) {
		throw new Error(error);
	}
});

/** 订单支付 */
const updateOrderStatus = asyncHandler(async (req, res) => {
	const { status } = req.body;
	const { id } = req.params;

	validateMongoDbId(id);

	try {
		const updateOrderStatus = await Order.findByIdAndUpdate(
			id,
			{
				orderStatus: status,
				paymentIntent: {
					status: status,
				},
			},
			{ new: true },
		);

		res.json(updateOrderStatus);
	} catch (error) {
		throw new Error(error);
	}
});

module.exports = {
	createUser,
	loginUserCtrl,
	getallUser,
	getaUser,
	deleteaUser,
	updatedUser,
	blockUser,
	unblockUser,
	handleRefreshToken,
	logout,
	updatePassword,
	forgotPasswordToken,
	resetPassword,
	loginAdmin,
	getWishlist,
	saveAddress,
	userCart,
	getUserCart,
	emptyCart,
	applyCoupon,
	createOrder,
	getOrders,
	updateOrderStatus,
};
