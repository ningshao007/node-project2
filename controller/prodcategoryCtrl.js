const Category = require('../models/prodcategoryModel.js');
const asyncHandler = require('express-async-handler');
const validateMongoDbId = require('../utils/validateMongodbId');

/** 新建category */
const createCategory = asyncHandler(async (req, res) => {
	try {
		const newCategory = await Category.create(req.body);

		res.json(newCategory);
	} catch (error) {
		throw new Error(error);
	}
});

/** 更新category */
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

/** 删除category */
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

/** 获取category */
const getCategory = asyncHandler(async (req, res) => {
	const { id } = req.params;

	validateMongoDbId(id);

	try {
		const getaCategory = await Category.findById(id);

		res.json(getaCategory);
	} catch (error) {
		throw new Error(error);
	}
});

/** 查询所有category */
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
