import Express from "express"; // 3RD PARTY MODULE (npm i express)
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { getMedia, writeMedias } from "../../lib/fs-tools.js";

const mediaRouter = Express.Router();

mediaRouter.post("/", async (req, res, next) => {
  const { title, year, type, poster } = req.body;
  const newMediaPost = {
    title,
    year,
    type,
    poster,
    imdbID: uniqid(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mediaArray = await getMedia();
  mediaArray.push(newMediaPost);
  await writeMedias(mediaArray);
  res.status(201).send({ id: newMediaPost.imdbID });
});

mediaRouter.get("/", async (req, res, next) => {
  try {
    const medias = await getMedia();
    if (req.query && req.query.title) {
      const filteredMedia = medias.filter((m) => m.title === req.query.title);
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

export default mediaRouter;
