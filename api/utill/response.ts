import { Response } from "express";

export const sendResponse = (
  message: string,
  statusCode: number,
  success: boolean,
  data: any,
  response: Response
) => {
  response
    .json({
      message,
      success,
      data,
    })
    .status(statusCode);
};
