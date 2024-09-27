import { NextFunction, Request, Response } from "express";
import { CustomRequest } from "interfaces";

export type ctrlrFunc = (
  req?: CustomRequest,
  res?: Response,
  next?: NextFunction
) => Promise<void | Response>;
