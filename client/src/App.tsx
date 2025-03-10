import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CalendarForm from "./components/CalendarForm";
import { ApiResponse, Room } from "./types";
import axios from "axios";

const App = () => {
  const [room, setRoom] = useState<string>("Meeting Room");
  const [person, setPerson] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [bookings, setBookings] = useState<Room[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]); // Date as string

  useEffect(() => {
    console.log("Frontend Selected Date:", date);

    const fetchMeetingRoomBookings = async () => {
      try {
        const { data } = await axios.post<ApiResponse>(
          `${import.meta.env.VITE_SERVER_URI}/api/room`,
          { roomName: room, date } // Sending date as 'YYYY-MM-DD'
        );

        if (data.success) {
          setBookings(data.data);
        }
      } catch (e: any) {
        console.log(e);
      }
    };

    fetchMeetingRoomBookings();
  }, [room, date]);

  return (
    <div className="flex flex-col gap-4 justify-center min-h-screen items-center py-4">
      <div className="flex flex-col gap-1 items-center -mb-2">
        <p className="text-lg font-semibold">EasyBook</p>
        <p className=" text-sm text-gray-600 font-semibold mb-2">
          Facility Booking by D&T
        </p>
      </div>
      <div className="flex flex-col gap-4 p-4 border border-border rounded-md w-[90vw] sm:w-96">
        <Select onValueChange={(value) => setRoom(value)}>
          <div>
            <label className="text-sm font-medium leading-none">
              Select room
            </label>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Meeting Room" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="Meeting Room">Meeting Room</SelectItem>
                <SelectItem value="Binding Room">Binding Room</SelectItem>
                <SelectItem value="Printing Room">Printing Room</SelectItem>
                <SelectItem value="Store Room">Store Room</SelectItem>
              </SelectGroup>
            </SelectContent>
          </div>
        </Select>
        <CalendarForm
          room={room}
          person={person}
          setPerson={setPerson}
          contact={contact}
          setContact={setContact}
          setDate={setDate} // Ensure it updates correctly
          setBookings={setBookings}
        />
      </div>
      <div className="flex flex-col gap-4 p-4 border border-border rounded-md w-[90vw] sm:w-96">
        <p className="font-semibold text-base">
          Today's booked list for {room}
        </p>
        {bookings.length === 0 ? (
          <p className="text-sm">No bookings yet. Book now.</p>
        ) : (
          bookings.map((booking) => (
            <div key={booking._id} className="border p-3 rounded-md">
              <div className="font-semibold">Booked by: {booking.person}</div>
              <div className="text-sm">
                <span className="font-medium">Contact:</span> {booking.contact}
              </div>
              <div className="text-sm">
                <span className="font-medium">Start Time:</span> {booking.start_time}
              </div>
              <div className="text-sm">
                <span className="font-medium">End Time:</span> {booking.end_time}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="fixed bottom-0 bg-primary w-full flex justify-center items-center py-1">
        <p className="text-xs text-center">
          Designed & Developed by Interactive Product Development Team
        </p>
      </div>
    </div>
  );
};

export default App;
