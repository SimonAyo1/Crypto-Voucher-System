import express from "express";
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


const app = express();

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



export default app