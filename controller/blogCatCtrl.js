const Category = require('../models/blogCatModel');
const asyncHandler = require('express-async-handler');
const validateMongoDbId = require('../utils/validateMongodbId');

/** 新建类目 */
const createCategory = asyncHandler(async (req, res) => {
	try {
		const newCategory = await Category.create(req.body);

		res.json(newCategory);
	} catch (error) {
		throw new Error(error);
	}
});

/** 修改类目 */
const updateCategory = asyncHandler(async (req, res) => {
	const { id } = req.params;

	validateMongoDbId(id);

	try {
		const updatedCategory = await Category.findByIdAndUpdate(id, req.body, {
			new: true,
		});
		res.json(updatedCategory);
	} catch (error) {
		throw new Error(error);
	}
});

/** 删除类目 */
const deleteCategory = asyncHandler(async (req, res) => {
	const { id } = req.params;

	validateMongoDbId(id);

	try {
		const deletedCategory = await Category.findByIdAndDelete(id);

		res.json(deletedCategory);
	} catch (error) {
		throw new Error(error);
	}
});

/** 查看类目 */
const getCategory = asyncHandler(async (req, res) => {
	const { id } = req.params;

	validateMongoDbId(id);

	try {
		const getCategory = await Category.findById(id);

		res.json(getCategory);
	} catch (error) {
		throw new Error(error);
	}
});

/** 查看所有类目 */
const getallCategory = asyncHandler(async (req, res) => {
	try {
		const getallCategory = await Category.find();

		res.json(getallCategory);
	} catch (error) {
		throw new Error(error);
	}
});

module.exports = {
	createCategory,
	updateCategory,
	deleteCategory,
	getCategory,
	getallCategory,
};