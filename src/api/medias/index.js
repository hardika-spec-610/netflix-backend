import Express from "express"; // 3RD PARTY MODULE (npm i express)
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { getMedia, writeMedias } from "../../lib/fs-tools.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { getPDFReadableStream } from "../../lib/pdf-tools.js";
import { pipeline } from "stream";
import {
  checkMediaSchema,
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

export default mediaRouter;
