import { Request, Response } from "express";
import { HttpError } from "http-errors";

export const errorHandler = (error: HttpError, req: Request, res: Response) => {
  res
    .status(error.status)
    .json({ error: error.message || "Internal Server Error" });
};
