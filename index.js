const express = require("express");
const app = express();
const port = process.env.PORT || 4000;

const cors = require("cors");
app.use(cors({ credentials: true }));
const dotenv = require("dotenv")
dotenv.config();

const connectDb = require('./config/db.js');
connectDb();

app.use(express.json());
const cookieParser = require("cookie-parser");
app.use(cookieParser());


const authRoute = require('./routes/authRoute.js');
app.use("/auth", authRoute);
const otpRoute = require('./routes/otpRoute.js');
app.use('/otp' , otpRoute )




app.listen(port, () => { console.log(`Server started on http://localhost:${port}`) })