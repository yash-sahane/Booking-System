import { Router } from "express";
import { addBooking, fetchBookings } from "../controller/room.js";

const router = Router();

router.post("/", fetchBookings);
router.post("/addBooking", addBooking);

export default router;
