import express from "express";
import dotenv from "dotenv";
import connectToDB from "./db/conn";
import { AuthRouter } from "./routes/AuthRoute";
import userRoutes from "./routes/UserRoute";
import voucherRoutes from "./routes/VoucherRoute";
import cors from "cors";

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
