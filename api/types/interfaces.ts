import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface LitecoinTransactionData {
  fromAddress: {
    address: string;
    privateKey: string;
  }[];
  to: {
    address: string;
    value: number;
  }[];
  fee: string;
  changeAddress: string;
}

export interface ResponseData<T> {
  status: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface IEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface CustomRequest extends Request {
  user?: any;
}
