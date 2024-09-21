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
import { errorHandler } from "./middlewares/errorHandler";
import createHttpError from "http-errors";

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

app.all("*", (req, res, next) => {
  next(createHttpError(404, `This route (${req.url}) does not exist`));
});

app.use(errorHandler);

const startApp = async () => {
  try {
    const db = await connectToDB();
    // await userModel.syncIndexes();
    // await adminModel.syncIndexes();
    // await Voucher.syncIndexes();
    // await Payment.syncIndexes();

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.log(`Could not start server on http://localhost:${port}`);
  }
};

startApp();
