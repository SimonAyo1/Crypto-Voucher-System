import app from "./src";
import connectToDB from "./src/db/conn";

import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 3000;

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
