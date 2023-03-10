import Express from "express";
import listEndpoints from "express-list-endpoints";
import cors from "cors";
import { join } from "path";
import {
  genericErrorHandler,
  badRequestHandler,
  unauthorizedHandler,
  notfoundHandler,
} from "./errorsHandlers.js";
import createHttpError from "http-errors";
import mediaRouter from "./api/medias/index.js";

const server = Express();
const port = process.env.PORT || 3001;

const publicFolderPath = join(process.cwd(), "./public");

console.log(process.env.SECRET);

const loggerMiddleware = (req, res, next) => {
  console.log(
    `Request method ${req.method} -- url ${req.url} -- ${new Date()}`
  );
  req.user = "Hardika";
  next();
};

const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL];

server.use(Express.static(publicFolderPath));
// server.use(cors());
server.use(
  cors({
    origin: (currentOrigin, corsNext) => {
      if (!currentOrigin || whitelist.indexOf(currentOrigin) !== -1) {
        // origin is in the whitelist
        corsNext(null, true);
      } else {
        // origin is not in the whitelist
        corsNext(
          createHttpError(
            400,
            `Origin ${currentOrigin} is not in the whitelist!`
          )
        );
      }
    },
  })
);
server.use(loggerMiddleware);
server.use(Express.json());

server.listen(port, () => {
  console.table(listEndpoints(server));
  console.log(`Server is running on port ${port}`);
});

server.use("/medias", mediaRouter);

// ************************* ERROR HANDLERS *******************
server.use(badRequestHandler); // 400
server.use(unauthorizedHandler); // 401
server.use(notfoundHandler); // 404
server.use(genericErrorHandler); // 500 (this should ALWAYS be the last one)

server.on("error", (error) =>
  console.log(`Server is not running due to: ${error}`)
);
