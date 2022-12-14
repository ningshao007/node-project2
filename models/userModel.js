const mongoose = require('mongoose'); // Erase if already required
const bcrypt = require('bcrypt');
const crypto = require('crypto');
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema(
	{
		firstname: {
			type: String,
			required: true,
		},
		lastname: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		mobile: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
		},
		role: {
			type: String,
			enum: ['user', 'admin', 'superAdmin'],
			default: 'user',
		},
		isBlocked: {
			type: Boolean,
			default: false,
		},
		cart: {
			type: Array,
			default: [],
		},
		address: {
			type: String,
		},
		wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
		refreshToken: {
			type: String,
		},
		passwordChangedAt: Date,
		passwordResetToken: String,
		passwordResetExpires: Date,
	},
	{
		timestamps: true,
	},
);

/** the 'pre' hooks is a middleware functin that is executed before a certain operation,such as saving or updating a document */
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		next();
	}

	const salt = await bcrypt.genSaltSync(10);
	this.password = await bcrypt.hash(this.password, salt);

	next();
});

/** 对比用户登录密码是否正确 */
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
	console.log('debugger', enteredPassword, this.password);
	return await bcrypt.compare(enteredPassword, this.password);
};

/** 生成重置密码(用户忘记登录密码时重置用,有时间限制) */
userSchema.methods.createPasswordResetToken = async function () {
	const resetToken = crypto.randomBytes(32).toString('hex');
	this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
	this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 10 minutes

	return resetToken;
};

//Export the model
module.exports = mongoose.model('User', userSchema);
