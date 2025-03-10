import ErrorHandler from "../middleware/error.js";
import Room from "../model/room.js";

export const fetchBookings = async (req, res, next) => {
  try {
    const { roomName, date } = req.body;

    console.log("Received date:", req.body.date);
    console.log("Server time:", new Date().toISOString());

    // Ensure roomName is provided
    if (!roomName) {
      return next(new ErrorHandler("Room name is required", 400));
    }

    // Ensure date is provided
    if (!date) {
      return next(new ErrorHandler("Date is required", 400));
    }

    // Convert the date to a JavaScript Date object
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return next(new ErrorHandler("Invalid date format", 400));
    }

    // Create a new Date object for the start and end of the selected day
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0)); // Start of the selected date
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999)); // End of the selected date

    console.log("start of day ", startOfDay);
    console.log("end of day ", endOfDay);


    // Fetch bookings for the selected room and date range
    const bookings = await Room.find({
      room: roomName,
      date: { $gte: startOfDay, $lte: endOfDay }, // Date should be within the selected day
    });

    // Return the bookings found
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
