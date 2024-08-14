import express from "express";
import dotenv from "dotenv";
import connectToDB from "./db/conn";
import { AuthRouter } from "./routes/AuthRoute";
import userRoutes from "./routes/UserRoute";
import voucherRoutes from "./routes/VoucherRoute";
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

app.use(AuthRouter);

app.use(userRoutes);

app.use(voucherRoutes);

const startApp = async () => {
  try {
    const db = await connectToDB();
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.log(`Could not start server on http://localhost:${port}`);
  }
};

startApp();
