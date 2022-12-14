const Product = require('../models/productModel');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const validateMongoDbId = require('../utils/validateMongodbId');
const cloudinaryUploadImg = require('../utils/cloudinary');
const fs = require('fs');

/** 新增商品 */
const createProduct = asyncHandler(async (req, res) => {
	try {
		// if (req.body.title) {
		// 	req.body.slug = slugify(req.body.title);
		// }
		const newProduct = await Product.create(req.body);

		res.json(newProduct);
	} catch (error) {
		throw new Error(error);
	}
});

/** 更新商品 FIXED: 更新不到传入的id值,只能更新数据库中的第一条数据 */
const updateProduct = asyncHandler(async (req, res) => {
	const id = req.params.id;

	validateMongoDbId(id);

	try {
		const updateProduct = await Product.findOneAndUpdate({ id: req.params.id }, req.body, {
			new: true,
		});

		res.json(updateProduct);
	} catch (error) {
		throw new Error(error);
	}
});

/** 删除商品 */
const deleteProduct = asyncHandler(async (req, res) => {
	const id = req.params;
	validateMongoDbId(id);

	try {
		const deleteProduct = await Product.findOneAndDelete(id);

		res.json(deleteProduct);
	} catch (error) {
		throw new Error(error);
	}
});

/** 获取商品 */
const getProduct = asyncHandler(async (req, res) => {
	const { id } = req.params;

	validateMongoDbId(id);

	try {
		const findProduct = await Product.findById(id).select('-createdAt -updatedAt -__v');

		res.json(findProduct);
	} catch (error) {
		throw new Error(error);
	}
});

/** 获取所有商品 */
const getAllProduct = asyncHandler(async (req, res) => {
	try {
		const queryObj = { ...req.query };
		const excludeFields = ['page', 'sort', 'limit', 'fields'];
		excludeFields.forEach((el) => delete queryObj[el]);
		let queryStr = JSON.stringify(queryObj);
		queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

		let query = Product.find(JSON.parse(queryStr));

		if (req.query.sort) {
			const sortBy = req.query.sort.split(',').join(' ');
			query = query.sort(sortBy);
		} else {
			query = query.sort('-createdAt');
		}

		if (req.query.fields) {
			const fields = req.query.fields.split(',').join(' ');
			query = query.select(fields);
		} else {
			query = query.select('-__v');
		}

		const page = req.query.page;
		const limit = req.query.limit;
		const skip = (page - 1) * limit;
		query = query.skip(skip).limit(limit);
		if (req.query.page) {
			const productCount = await Product.countDocuments();
			if (skip >= productCount) throw new Error('This Page does not exists');
		}
		const product = await query;
		res.json(product);
	} catch (error) {
		throw new Error(error);
	}
});

/** 添加愿望清单 */
const addToWishlist = asyncHandler(async (req, res) => {
	const { _id } = req.user;
	const { prodId } = req.body;

	try {
		const user = await User.findById(_id);
		const alreadyAdded = user.wishlist.find((id) => id.toString() === prodId);

		if (alreadyAdded) {
			let user = await User.findByIdAndUpdate(
				_id,
				{
					$pull: { wishlist: prodId },
				},
				{
					new: true,
				},
			);
			res.json(user);
		} else {
			let user = await User.findByIdAndUpdate(
				_id,
				{
					$push: { wishlist: prodId },
				},
				{
					new: true,
				},
			);
			res.json(user);
		}
	} catch (error) {
		throw new Error(error);
	}
});

/** 添加评论 */
const rating = asyncHandler(async (req, res) => {
	const { _id } = req.user;
	const { star, prodId, comment } = req.body;

	try {
		const product = await Product.findById(prodId);
		let alreadyRated = product.ratings.find((userId) => userId.postedBy.toString() === _id.toString());

		if (alreadyRated) {
			await Product.updateOne(
				{
					ratings: { $elemMatch: alreadyRated },
				},
				{
					$set: { 'ratings.$.star': star, 'ratings.$.comment': comment },
				},
				{
					new: true,
				},
			);
		} else {
			await Product.findByIdAndUpdate(
				prodId,
				{
					$push: {
						ratings: {
							star: star,
							comment: comment,
							postedBy: _id,
						},
					},
				},
				{
					new: true,
				},
			);
		}

		const getallRatings = await Product.findById(prodId);
		let totalRating = getallRatings.ratings.length;
		let ratingSum = getallRatings.ratings.map((item) => item.star).reduce((prev, curr) => prev + curr, 0);
		let actualRating = Math.round(ratingSum / totalRating);

		// 综合评分
		let finalProduct = await Product.findByIdAndUpdate(
			prodId,
			{
				totalRating: actualRating,
			},
			{ new: true },
		);

		res.json(finalProduct);
	} catch (error) {
		throw new Error(error);
	}
});

/** 上传商品图片 */
const uploadImages = asyncHandler(async (req, res) => {
	const { id } = req.params;

	validateMongoDbId(id);

	console.log(req.files);

	try {
		// const uploader = (path) => cloudinaryUploadImg(path, 'images');
		const urls = [];
		const files = req.files;
		for (const file of files) {
			const { path } = file;
			// const newpath = await uploader(path);
			// console.log(newpath);
			// urls.push(newpath);
			// fs.unlinkSync(path);
		}
		const findProduct = await Product.findByIdAndUpdate(
			id,
			{
				images: urls.map((file) => {
					return file;
				}),
			},
			{
				new: true,
			},
		);
		res.json(findProduct);
	} catch (error) {
		throw new Error(error);
	}
});

module.exports = {
	createProduct,
	getProduct,
	getAllProduct,
	updateProduct,
	deleteProduct,
	addToWishlist,
	rating,
	uploadImages,
};
