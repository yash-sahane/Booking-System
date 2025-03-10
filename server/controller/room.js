import ErrorHandler from "../middleware/error.js";
import Room from "../model/room.js";

export const fetchBookings = async (req, res, next) => {
  try {
    const { roomName, date } = req.body;

    console.log("Received date (from frontend):", date);
    console.log("Server time:", new Date().toISOString());

    if (!roomName) return next(new ErrorHandler("Room name is required", 400));
    if (!date) return next(new ErrorHandler("Date is required", 400));

    // Directly parse ISO date from frontend
    // const selectedDate = new Date(date);
    // if (isNaN(selectedDate.getTime())) {
    //   return next(new ErrorHandler("Invalid date format", 400));
    // }

    // // Calculate start and end of day in UTC
    // const startOfDay = new Date(Date.UTC(
    //   selectedDate.getUTCFullYear(),
    //   selectedDate.getUTCMonth(),
    //   selectedDate.getUTCDate(),
    //   0, 0, 0, 0
    // ));

    // const endOfDay = new Date(Date.UTC(
    //   selectedDate.getUTCFullYear(),
    //   selectedDate.getUTCMonth(),
    //   selectedDate.getUTCDate(),
    //   23, 59, 59, 999
    // ));

    // console.log("Corrected Start of Day (UTC):", startOfDay.toISOString());
    // console.log("Corrected End of Day (UTC):", endOfDay.toISOString());

    // Fetch bookings using the corrected UTC time range
    const bookings = await Room.find({
      room: roomName,
      date,
    });

    return res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error(error);
    next(new ErrorHandler("Server Error", 500));
  }
};

export const addBooking = async (req, res, next) => {
  try {
    const { startTime, endTime, roomName, person, contact, date } = req.body;

    // console.log(startTime, endTime, roomName, person, contact, date);

    if (
      !roomName ||
      !startTime ||
      !endTime ||
      !roomName ||
      !person ||
      !contact ||
      !date
    ) {
      return next(new ErrorHandler("Please enter required fields", 400));
    }

    const booking = await Room.create({
      start_time: startTime,
      end_time: endTime,
      room: roomName,
      person,
      contact,
      date,
    });

    return res.json({
      success: true,
      data: booking,
      message: `${roomName} has been booked successfully`,
    });
  } catch (e) {
    console.log(e);
  }
};
