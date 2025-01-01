import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  start_time: {
    type: String,
    required: true,
  },
  end_time: {
    type: String,
    required: true,
  },
  room: {
    type: String,
    required: true,
    enum: ["Meeting Room", "Binding Room", "Printing Room"],
  },
  person: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
});

const Room = mongoose.model("room", roomSchema);

export default Room;
