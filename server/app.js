import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { connectDB } from "./database/connect.js";
import Room from "./routes/room.js";
import { errMiddleware } from "./middleware/error.js";
import job from "./cron/cron.js";

job.start();

const app = express();

config();

connectDB();

app.use(express.json());
app.use(cors());

app.listen(process.env.PORT, (req, res) => {
  console.log("server is running on port", process.env.PORT);
});

app.use("/api/room/", Room);

app.use(errMiddleware);
