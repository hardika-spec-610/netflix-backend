import Express from "express"; // 3RD PARTY MODULE (npm i express)
import uniqid from "uniqid";
import createHttpError from "http-errors";
import {
  getMedia,
  getReviews,
  writeMedias,
  writeReviews,
} from "../../lib/fs-tools.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { getPDFReadableStream } from "../../lib/pdf-tools.js";
import { pipeline } from "stream";
import {
  checkMediaSchema,
  checkReviewSchema,
  checkReviewUpdateSchema,
  checkmediaUpdateSchema,
  triggerBadRequest,
} from "./validation.js";

const mediaRouter = Express.Router();

mediaRouter.post(
  "/",
  checkMediaSchema,
  triggerBadRequest,
  async (req, res, next) => {
    const { Title, Year, Type, Poster } = req.body;
    const newMediaPost = {
      Title,
      Year,
      Type,
      Poster,
      imdbID: uniqid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mediaArray = await getMedia();
    mediaArray.push(newMediaPost);
    await writeMedias(mediaArray);
    res.status(201).send({ id: newMediaPost.imdbID });
  }
);

mediaRouter.get("/", async (req, res, next) => {
  try {
    const medias = await getMedia();
    if (req.query && req.query.title) {
      const filteredMedia = medias.filter((m) => m.Title === req.query.title);
      res.send(filteredMedia);
    } else {
      res.send(medias);
    }
  } catch (error) {
    next(createHttpError(500, `Server side error`));
  }
});

mediaRouter.get("/:id", async (req, res, next) => {
  try {
    const medias = await getMedia();
    const foundMedia = medias.find((m) => m.imdbID === req.params.id);
    if (foundMedia) {
      res.send(foundMedia);
    } else {
      next(createHttpError(404, `Media with id ${req.params.id} not found!`)); // this jumps to the error handlers
    }
  } catch (error) {
    next(error); // This error does not have a status code, it should trigger a 500
  }
});

mediaRouter.put(
  "/:id",
  checkmediaUpdateSchema,
  triggerBadRequest,
  async (req, res, next) => {
    try {
      const medias = await getMedia();

      const index = medias.findIndex((m) => m.imdbID === req.params.id);
      if (index !== -1) {
        const oldMedia = medias[index];
        const updatedMedia = {
          ...oldMedia,
          ...req.body,
          updatedAt: new Date(),
        };
        medias[index] = updatedMedia;
        await writeMedias(medias);
        res.send(updatedMedia);
      } else {
        next(createHttpError(404, `Media with id ${req.params.id} not found!`));
      }
    } catch (error) {
      next(error);
    }
  }
);

mediaRouter.delete("/:id", async (req, res, next) => {
  try {
    const medias = await getMedia();

    const remainingMedia = medias.filter((m) => m.imdbID !== req.params.id);
    if (medias.length !== remainingMedia.length) {
      await writeMedias(remainingMedia);
      res.status(204).send(`Media with id ${req.params.id} deleted!`);
    } else {
      next(createHttpError(404, `Media with id ${req.params.id} not found!`)); //
    }
  } catch (error) {
    next(error);
  }
});

const cloudinaryUploaderPoster = multer({
  storage: new CloudinaryStorage({
    cloudinary, // cloudinary is going to search for smth in .env vars called process.env.CLOUDINARY_URL
    params: {
      folder: "Netflix movie poster/medias",
    },
  }),
}).single("Poster");

mediaRouter.post(
  "/:id/poster",
  cloudinaryUploaderPoster,
  async (req, res, next) => {
    try {
      console.log("FILE:", req.file);
      const medias = await getMedia();
      const index = medias.findIndex((m) => m.imdbID === req.params.id);
      if (index !== -1) {
        const oldMedia = medias[index];
        const updatedMedia = {
          ...oldMedia,
          ...req.body,
          Poster: req.file.path,
          updatedAt: new Date(),
        };
        medias[index] = updatedMedia;
        await writeMedias(medias);
        res.send(updatedMedia);
      } else {
        res
          .status(404)
          .send({ message: `Media with ${req.params.id} is not found!` });
      }
    } catch (error) {
      next(error);
    }
  }
);

mediaRouter.get("/:id/pdf", async (req, res, next) => {
  try {
    const medias = await getMedia();
    const foundMedia = medias.find((m) => m.imdbID === req.params.id);
    if (foundMedia) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${foundMedia.Title}.pdf`
      );
      const source = await getPDFReadableStream(foundMedia);
      const destination = res;
      pipeline(source, destination, (err) => {
        if (err) console.log(err);
        source.end();
      });
    } else {
      res.status(404).send("Media is not found");
    }
  } catch (error) {
    next(error);
  }
});

mediaRouter.post(
  "/:id/reviews",
  checkReviewSchema,
  triggerBadRequest,
  async (req, res, next) => {
    try {
      const medias = await getMedia();
      const index = medias.findIndex((m) => m.imdbID === req.params.id);
      if (index !== -1) {
        const { comment, rate } = req.body;
        const newReview = {
          comment,
          rate,
          elementId: req.params.id,
          _id: uniqid(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const reviews = await getReviews();
        reviews.push(newReview);
        await writeReviews(reviews);
        res.status(201).send(reviews);
      } else {
        next(createHttpError(404, `no review found with id ${req.params.id}`));
      }
    } catch (error) {
      next(error);
    }
  }
);

mediaRouter.get("/:id/reviews", async (req, res, next) => {
  try {
    const medias = await getMedia();
    const index = medias.findIndex((m) => m.imdbID === req.params.id);
    // console.log("reviewGetindex", index);
    if (index !== -1) {
      const reviews = (await getReviews()).filter(
        (r) => r.elementId === req.params.id
      );
      console.log("reviewGet", reviews);
      res.send(reviews);
    } else {
      next(createHttpError(404, `no review found with id ${req.params.id}`));
    }
  } catch (error) {
    next(createHttpError(500, `Server side error`));
  }
});

mediaRouter.get("/:id/reviews/:reviewId", async (req, res, next) => {
  try {
    const medias = await getMedia();
    const index = medias.findIndex((m) => m.imdbID === req.params.id);
    // console.log("reviewGetindex", index);
    if (index !== -1) {
      const reviews = (await getReviews()).filter(
        (r) => r.elementId === req.params.id
      );
      //   console.log("reviewGet", reviews);
      const foundReview = reviews.find(
        (review) => review._id === req.params.reviewId
      );
      if (foundReview) {
        res.send(foundReview);
      } else {
        next(
          createHttpError(
            404,
            `Review not found with id ${req.params.reviewId} of this product with id ${req.params.id}`
          )
        );
      }
    } else {
      next(createHttpError(404, `Media not found with id ${req.params.id}`));
    }
  } catch (error) {
    next(createHttpError(500, `Server side error`));
  }
});

mediaRouter.put(
  "/:id/reviews/:reviewId",
  checkReviewUpdateSchema,
  triggerBadRequest,
  async (req, res, next) => {
    try {
      const medias = await getMedia();
      const index = medias.findIndex((m) => m.imdbID === req.params.id);
      // console.log("reviewGetindex", index);
      if (index !== -1) {
        const reviews = await getReviews();
        // find review index?
        const reviewIndex = reviews.findIndex(
          (review) => review._id === req.params.reviewId
        );
        if (reviewIndex !== -1) {
          // console.log("reviewGetindex", reviewIndex);
          const updated = {
            ...reviews[reviewIndex],
            ...req.body,
            updatedAt: new Date(),
          };
          reviews[reviewIndex] = updated;
          await writeReviews(reviews);
          res.send(updated);
        } else {
          next(
            createHttpError(
              404,
              `Review not found with id ${req.params.reviewId}`
            )
          );
        }
      } else {
        next(
          createHttpError(404, `Product not found with id ${req.params.id}`)
        );
      }
    } catch (error) {
      next(createHttpError(500, `Server side error`));
    }
  }
);

mediaRouter.delete("/:id/reviews/:reviewId", async (req, res, next) => {
  try {
    const medias = await getMedia();
    const index = medias.findIndex((m) => m.imdbID === req.params.id);
    // console.log("reviewGetindex", index);
    if (index !== -1) {
      const reviews = await getReviews();
      // find review index?
      const reviewIndex = reviews.findIndex(
        (review) => review._id === req.params.reviewId
      );
      if (reviewIndex !== -1) {
        // console.log("reviewGetindex", reviewIndex);
        const remainingReview = reviews.filter(
          (review) => review._id !== req.params.reviewId
        );
        await writeReviews(remainingReview);
        res.status(204).send("review deleted");
      } else {
        next(
          createHttpError(
            404,
            `Review not found with id ${req.params.reviewId}`
          )
        );
      }
    } else {
      next(createHttpError(404, `Media not found with id ${req.params.id}`));
    }
  } catch (error) {
    next(createHttpError(500, `Server side error`));
  }
});

export default mediaRouter;
