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
// import { BackgroundBeams } from "./components/ui/background-beams";

const App = () => {
  // const [startTime, setStartTime] = useState<string>("08:30 AM");
  // const [endTime, setEndTime] = useState<string>("08:30 AM");
  const [room, setRoom] = useState<string>("Meeting Room");
  const [person, setPerson] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [bookings, setBookings] = useState<Room[]>([]);
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchMeetingRoomBookings = async () => {
      try {
        const { data } = await axios.post<ApiResponse>(
          `${import.meta.env.VITE_SERVER_URI}/api/room`,
          { roomName: room, date }
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
      <p className="text-lg font-semibold -mb-2">EasyBook</p>
      <div className="flex flex-col gap-4 p-4 border border-border rounded-md w-[90vw] sm:w-96">
        <Select onValueChange={(value) => setRoom(value)}>
          <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
          setDate={setDate}
          setBookings={setBookings}
        />
      </div>
      <div className="flex flex-col gap-4 p-4 border border-border rounded-md w-[90vw] sm:w-96">
        <p className="font-semibold text-base">
          Today's booked list for {room}
        </p>
        {!bookings ? (
          <p className="text-sm">Meeting room has not booked yet. Book now.</p>
        ) : (
          bookings.map((booking) => (
            <div className="flex items-start flex-col gap-4 border border-border rounded-md  p-3">
              <div className="flex items-start gap-4">
                <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                    {booking.person.split(" ")[0][0]}
                    {booking.person.split(" ")[1]
                      ? booking.person.split(" ")[1][0]
                      : ""}
                  </span>
                </span>
                <div className="flex flex-col gap-[6px]">
                  <div className="grid gap-1">
                    <div className="font-semibold">
                      Booked by : {booking.person}
                    </div>
                    <div className="line-clamp-1 text-sm">
                      <span className="font-medium">Contact Number :</span>{" "}
                      {booking.contact}
                    </div>
                  </div>
                  <div className="line-clamp-1 text-sm">
                    <span className="font-medium">Start Time :</span>{" "}
                    {booking.start_time}
                  </div>
                  <div className="line-clamp-1 text-sm">
                    <span className="font-medium">End Time : </span>{" "}
                    {booking.end_time}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* <BackgroundBeams /> */}
    </div>
  );
};

export default App;
