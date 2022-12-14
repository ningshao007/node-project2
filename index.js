const bodyParser = require('body-parser');
const express = require('express');
const dbConnect = require('./config/dbConnect');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const dotenv = require('dotenv').config();

const app = express();
const PORT = 5000;

const authRouter = require('./routes/authRoute');
const productRouter = require('./routes/productRoute');
const blogRouter = require('./routes/blogRoute');
const categoryRouter = require('./routes/prodcategoryRoute');
const blogCategoryRouter = require('./routes/blogCatRoute');
const brandRouter = require('./routes/brandRoute');
const couponRouter = require('./routes/couponRoute');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

dbConnect();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/** 用户信息 */
app.use('/api/user', authRouter);
/** 商品信息 */
app.use('/api/product', productRouter);
/** blog信息  */
app.use('/api/blog', blogRouter);
/** category信息  */
app.use('/api/category', categoryRouter);
/** 商品类目 */
app.use('/api/blogcategory', blogCategoryRouter);
app.use('/api/brand', brandRouter);
/** 优惠卷 */
app.use('/api/coupon', couponRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`Server is running  at PORT ${PORT}`);
});
