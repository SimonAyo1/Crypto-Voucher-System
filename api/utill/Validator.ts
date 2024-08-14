// import { Request, Response, NextFunction } from "express";
// import { validationResult, ValidationChain } from "express-validator";

// const requestValidator = (validations: ValidationChain[]) => {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     await Promise.all(validations.map((validation) => validation.run(req)));

//     const errors = validationResult(req);
//     if (errors.isEmpty()) {
//         console.log(errors);
//       return next();
//     }
//     console.log("escape")

//     return res.status(400).json({ errors: errors.array() });
//   };
// };

// export default requestValidator;
