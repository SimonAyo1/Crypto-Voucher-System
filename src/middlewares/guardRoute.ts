import { Response, NextFunction } from "express";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { CustomRequest } from "interfaces";

const verifyToken = (req: CustomRequest, next: NextFunction): any => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(createHttpError.Unauthorized());
  }

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, process.env.SECRET_KEY as string);
  } catch (error) {
    return next(createHttpError.Unauthorized());
  }
};

export const adminProtect = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const decoded = verifyToken(req, next);
  if (!decoded) return;

  if ((decoded as any).role !== "admin") {
    return next(createHttpError.Unauthorized("Access denied, not admin!"));
  }

  req.user = decoded;
  next();
};

export const userProtect = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const decoded = verifyToken(req, next);
  if (!decoded) return;

  req.user = decoded;
  next();
};
