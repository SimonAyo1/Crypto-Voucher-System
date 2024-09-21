import crypto from "crypto";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { Response } from "express";
import fs from "fs";
import {
  IEmailOptions,
  LitecoinTransactionData,
  ResponseData,
} from "interfaces";
import axios from "axios";

export const generateRandomCode = (length: number): string => {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a Nodemailer transporter instance with the provided SMTP configuration.
 *
 * @remarks
 * This function initializes a transporter object using the provided SMTP host, user, and password.
 * The transporter is configured to use the default SMTP port and does not enforce SSL/TLS.
 *
 * @param {string} process.env.MAIL_HOST - The SMTP host.
 * @param {string} process.env.EMAIL_USER - The SMTP user.
 * @param {string} process.env.EMAIL_PASS - The SMTP password.
 *
 * @returns {nodemailer.Transporter} - A Nodemailer transporter instance.
 */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  //   port: process.env.MAIL_PORT,
  //   secure: true,
});

/**
 * Sends an email using the configured Nodemailer transporter.
 *
 * @remarks
 * This function takes an `IEmailOptions` object as a parameter, which contains the necessary details for sending an email.
 * It constructs a `mailOptions` object using the provided email details and sends the email using the `transporter`.
 *
 * @param {IEmailOptions} options - The email options object containing the recipient's email address, subject, text, and HTML content.
 * @param {string} options.to - The recipient's email address.
 * @param {string} options.subject - The email subject.
 * @param {string} options.text - The plain text content of the email.
 * @param {string} options.html - The HTML content of the email.
 *
 * @returns {Promise<SMTPTransport.SentMessageInfo>} - A promise that resolves to an object containing information about the sent email.
 *
 * @throws {Error} - If there is an error sending the email.
 */
export const sendEmail = async (
  options: IEmailOptions
): Promise<SMTPTransport.SentMessageInfo> => {
  const { to, subject, text, html } = options;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Sends a success response with the provided message, data, and status code.
 *
 * @remarks
 * This function constructs a `ResponseData` object with the provided message, data, and status.
 * It then sends a JSON response using the provided Express `Response` object, setting the status code and returning the constructed response.
 *
 * @template T - The type of the data to be included in the response.
 *
 * @param {Response} res - The Express response object.
 * @param {string} message - The message to be included in the response.
 * @param {T} [data] - The data to be included in the response. This parameter is optional.
 * @param {number} [statusCode=200] - The HTTP status code to be included in the response. The default value is 200.
 *
 * @returns {void} - This function does not return a value.
 */
export const sendSuccessResponse = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
) => {
  const response: ResponseData<T> = {
    status: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Fetches the current price of Litecoin in US dollars from the CoinGecko API.
 *
 * @remarks
 * This function sends a GET request to the CoinGecko API to retrieve the current price of Litecoin in US dollars.
 * It uses the provided API endpoint and parameters to make the request.
 * If the request is successful, the function extracts the price from the response and returns it.
 * If an error occurs during the request, the function logs the error and returns `null`.
 *
 * @returns {Promise<number | null>} - A promise that resolves with the current price of Litecoin in US dollars if the request is successful.
 * If an error occurs during the request, the promise will be rejected with the error and return `null`.
 */
export const fetchLtcPriceInDollars = async (): Promise<number | null> => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: "litecoin",
          vs_currencies: "usd",
        },
      }
    );

    const ltcPriceInDollars = response.data.litecoin.usd;
    return ltcPriceInDollars;
  } catch (error) {
    console.error("Error fetching LTC price:", error);
    return null;
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Sends a Litecoin transaction using the Tatum API.
 *
 * This function sends a POST request to the Tatum API endpoint for Litecoin transactions.
 * It includes the necessary headers and transaction data in the request body.
 * If the request is successful, the function resolves with the response data.
 * If an error occurs during the request, the function logs the error and rethrows it.
 *
 * @param {LitecoinTransactionData} transactionData - The transaction data to be sent.
 * @param {string} transactionData.fromPrivateKey - The private key of the sender's wallet.
 * @param {string} transactionData.toAddress - The recipient's Litecoin address.
 * @param {number} transactionData.amount - The amount of Litecoin to be sent.
 * @param {number} [transactionData.fee] - The transaction fee. If not provided, the API will calculate the optimal fee.
 *
 * @returns {Promise<any | null>} - A promise that resolves with the response data if the request is successful.
 * If an error occurs during the request, the promise will be rejected with the error.
 *
 * @throws {Error} - If an error occurs during the request.
 */
export const sendLitecoinTransaction = async (
  transactionData: LitecoinTransactionData
): Promise<any | null> => {
  const url = "https://api.tatum.io/v3/litecoin/transaction";

  try {
    const response = await axios.post(url, transactionData, {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": process.env.TATUM_API_KEY,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error sending Litecoin transaction:", error);
    throw error;
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Reads the contents of an HTML file from the specified file path.
 *
 * @remarks
 * This function uses the `fs.readFile` method to read the contents of an HTML file.
 * It returns a promise that resolves to the HTML content as a string if the file is successfully read.
 * If an error occurs during the file reading process, the promise will be rejected with the error.
 *
 * @param {string} filePath - The file path of the HTML file to be read.
 *
 * @returns {Promise<string>} - A promise that resolves to the HTML content as a string if the file is successfully read.
 * If an error occurs during the file reading process, the promise will be rejected with the error.
 */
export const readHTMLFile = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: "utf-8" }, (err, html) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(html);
      }
    });
  });
};
