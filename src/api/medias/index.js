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
export default mediaRouter;
