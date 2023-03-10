import { checkSchema, validationResult } from "express-validator";
import createHttpError from "http-errors";

const mediaSchema = {
  Title: {
    in: ["body"],
    notEmpty: true,
    trim: true,
    isString: {
      errorMessage: "Title is a mandatory field and needs to be a string!",
    },
  },
  Year: {
    in: ["body"],
    notEmpty: true,
    trim: true,
    isString: {
      errorMessage: "Year is a mandatory field and needs to be a string!",
    },
  },
  Type: {
    in: ["body"],
    notEmpty: true,
    trim: true,
    isString: {
      errorMessage: "Type is a mandatory field and needs to be a string!",
    },
  },
  Poster: {
    in: ["body"],
    notEmpty: true,
    trim: true,
    isURL: {
      errorMessage: "Poster is a mandatory field!",
    },
  },
};
const mediaUpdateSchema = {
  Title: {
    in: ["body"],
    optional: true,
    notEmpty: true,
    trim: true,
    isString: {
      errorMessage: "Title is a mandatory field and needs to be a string!",
    },
  },
  Year: {
    in: ["body"],
    optional: true,
    notEmpty: true,
    trim: true,
    isString: {
      errorMessage: "Year is a mandatory field and needs to be a string!",
    },
  },
  Type: {
    in: ["body"],
    optional: true,
    notEmpty: true,
    trim: true,
    isString: {
      errorMessage: "Type is a mandatory field and needs to be a string!",
    },
  },
  Poster: {
    in: ["body"],
    optional: true,
    notEmpty: true,
    trim: true,
    isURL: {
      errorMessage: "Poster is a mandatory field!",
    },
  },
};
export const checkMediaSchema = checkSchema(mediaSchema);
export const checkmediaUpdateSchema = checkSchema(mediaUpdateSchema);

export const triggerBadRequest = (req, res, next) => {
  // 1. Check if checkBooksSchema has found any error in req.body
  const errors = validationResult(req);
  console.log(errors.array());
  if (errors.isEmpty()) {
    // 2.1 If we don't have errors --> normal flow (next)
    next();
  } else {
    // 2.2 If we have any error --> trigger 400
    next(
      createHttpError(400, "Errors during blog validation", {
        errorsList: errors.array(),
      })
    );
  }
};
