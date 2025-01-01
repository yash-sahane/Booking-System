import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(process.env.MONGO_URI, {
      dbName: "room-booking",
    })
    .then((c) => {
      console.log("Database connected");
    })
    .catch((e) => {
      console.log(e);
    });
};
