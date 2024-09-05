import bcrypt from "bcrypt";
import express from "express";
import dotenv from "dotenv";
import connectToDB from "./db/conn";
import { AuthRouter } from "./routes/AuthRoute";
import userRoutes from "./routes/UserRoute";
import voucherRoutes from "./routes/VoucherRoute";
import cors from "cors";
import paymentRoutes from "./routes/PaymentRoute";
import adminModel from "./models/Admin";
import userModel from "./models/Users";
import { Voucher } from "./models/Voucher";
import { Payment } from "./models/Payment";

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());

app.use(express.json());

app.get("/", (req, res, next) => {
  res.json({
    message: "Great!",
  });
  next();
});

app.use(AuthRouter);

app.use(userRoutes);

app.use(voucherRoutes);

app.use(paymentRoutes);

const startApp = async () => {
  try {
    const db = await connectToDB();
    await userModel.syncIndexes();
    await adminModel.syncIndexes();
    await Voucher.syncIndexes();
    await Payment.syncIndexes();

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
    // const hashedPassword = await bcrypt.hash("password", 10);

    // const registerObj = {
    //   password: hashedPassword,
    //   email: "admin@test-voucher.com",
    // };

    // try {
    //   const user = await adminModel.create(registerObj);
    //   console.log(user);
    // } catch (error) {}
  } catch (error) {
    console.log(`Could not start server on http://localhost:${port}`);
  }
};

startApp();
