import { Response } from "express";

export const sendResponse = (
  message: string,
  statusCode: number,
  success: boolean,
  data: any,
  response: Response
) => {
  response.status(statusCode).json({
    message,
    success,
    data,
  });
};
