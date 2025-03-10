"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";
import { Input } from "./ui/input";
import React, { useCallback } from "react";
import debounce from "lodash/debounce";
import { ApiResponse, Room } from "@/types";
import axios from "axios";

const FormSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"), // YYYY-MM-DD format
  startTime: z.string({ required_error: "Start time is required!" }),
  endTime: z.string({ required_error: "End time is required!" }),
  person: z.string({ required_error: "Person / Team name is required!" }),
  contact: z.string({ required_error: "Contact number is required!" }),
});

type FormProps = {
  room: string;
  person: string;
  setPerson: React.Dispatch<React.SetStateAction<string>>;
  contact: string;
  setContact: React.Dispatch<React.SetStateAction<string>>;
  setDate: React.Dispatch<React.SetStateAction<string>>;
  setBookings: React.Dispatch<React.SetStateAction<Room[]>>;
};

function CalendarForm({ person, setPerson, contact, setContact, room, setDate, setBookings }: FormProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      startTime: "08:30 AM",
      endTime: "08:30 AM",
      date: new Date().toISOString().split('T')[0],
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const { person, contact, date, startTime, endTime } = data;

    if (!room) {
      toast.error("Please select a room.");
      return;
    }

    const currentDateTime = new Date();
    const selectedDate = new Date(date);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time to start of the day

    if (selectedDate < today) {
      toast.error("You can't book a meeting room for a past date.");
      return;
    }

    // Convert `startTime` and `endTime` to 24-hour format
    const parseTime = (time: string) => {
      const [timePart, modifier] = time.split(" ");
      let [hours, minutes] = timePart.split(":").map(Number);

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    // Convert to proper Date format
    const formattedStartTime = parseTime(startTime);
    const formattedEndTime = parseTime(endTime);

    const selectedStartTime = new Date(`${date} ${formattedStartTime}`);
    const selectedEndTime = new Date(`${date} ${formattedEndTime}`);

    console.log(date, " ", startTime, " -> ", selectedStartTime);
    console.log(date, " ", endTime, " -> ", selectedEndTime);

    if (
      date === currentDateTime.toISOString().split('T')[0] &&
      selectedStartTime < currentDateTime
    ) {
      toast.error("Start time must be in the future.");
      return;
    }

    if (selectedEndTime <= selectedStartTime) {
      toast.error("End time must be later than start time.");
      return;
    }

    try {
      // Fetch existing bookings for the room and date
      const { data: existingBookingsData } = await axios.post<ApiResponse>(
        `${import.meta.env.VITE_SERVER_URI}/api/room/`,
        { roomName: room, date }
      );

      if (existingBookingsData.success) {
        const isOverlapping = existingBookingsData.data.some((booking: any) => {
          const bookingStartTime = new Date(`${booking.date}T${booking.start_time}`);
          const bookingEndTime = new Date(`${booking.date}T${booking.end_time}`);

          return (
            (selectedStartTime >= bookingStartTime && selectedStartTime < bookingEndTime) ||
            (selectedEndTime > bookingStartTime && selectedEndTime <= bookingEndTime) ||
            (selectedStartTime <= bookingStartTime && selectedEndTime >= bookingEndTime)
          );
        });

        if (isOverlapping) {
          toast.error("The selected time overlaps with an existing booking. Please choose a different time.");
          return;
        }
      }

      // API call to add the booking
      const { data: addBookingData } = await axios.post<ApiResponse>(
        `${import.meta.env.VITE_SERVER_URI}/api/room/addBooking`,
        { date, startTime, endTime, roomName: room, person, contact }
      );

      if (addBookingData.success) {
        toast.success(addBookingData.message!);

        // Clear form fields on successful submission
        form.reset();
        setPerson("");
        setContact("");

        // Fetch updated bookings
        const { data: fetchBookingData } = await axios.post<ApiResponse>(
          `${import.meta.env.VITE_SERVER_URI}/api/room`,
          { roomName: room, date }
        );

        if (fetchBookingData.success) {
          setBookings(fetchBookingData.data);
        }
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("An error occurred while processing your booking. Please try again.");
    }
  }


  const timeOptions = Array.from({ length: 69 }).map((_, i) => {
    if (i <= 33) return null;
    const hour24 = Math.floor(i / 4);
    const minute = ((i % 4) * 15).toString().padStart(2, "0");

    // Convert 24-hour format to 12-hour format
    const hour12 = hour24 % 12 || 12; // Convert 0 to 12 for midnight
    const ampm = hour24 < 12 ? "AM" : "PM";
    const hour12Str = hour12.toString().padStart(2, "0");

    return (
      <SelectItem key={i} value={`${hour12Str}:${minute} ${ampm}`}>
        {hour12Str}:{minute} {ampm}
      </SelectItem>
    );
  });

  const setValueHandler = useCallback(
    debounce((type: string, value: string) => {
      if (type === "person") {
        setPerson(value);
      } else {
        setContact(value);
      }
    }, 0),
    []
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of booking</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined} // Convert string to Date
                    onSelect={(newDate) => {
                      if (newDate) {
                        const localDate = format(newDate, "yyyy-MM-dd"); // Format in local time
                        field.onChange(localDate);
                        setDate(localDate);
                      } else {
                        field.onChange("");
                        setDate("");
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4 !mt-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-0">
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Select
                    value={field.value || "08:30 AM"}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                  >
                    <SelectTrigger className="font-normal focus:ring-0 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[15rem]">
                        {timeOptions}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Select
                    value={field.value || "08:30 AM"}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                  >
                    <SelectTrigger className="font-normal focus:ring-0 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[15rem]">
                        {timeOptions}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="person"
          render={({ field }) => (
            <FormItem className="flex flex-col !mt-4">
              <FormLabel>Person / Team name</FormLabel>
              <FormControl>
                <Input
                  className="text-sm"
                  value={person}
                  onChange={(e) => {
                    setValueHandler("person", e.target.value);
                    field.onChange(e.target.value);
                  }}
                  placeholder="Enter the name of team or person"
                  type="text"
                ></Input>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem className="flex flex-col !mt-4">
              <FormLabel>Contact Number</FormLabel>
              <FormControl>
                <Input
                  className="text-sm"
                  value={contact}
                  type="text"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  minLength={10}
                  placeholder="Enter the contact number"
                  onChange={(e) => {
                    e.target.value = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 10);
                    setValueHandler("contact", e.target.value);
                    field.onChange(e.target.value);
                  }}
                ></Input>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="!mt-4">
          Submit
        </Button>
      </form>
    </Form>
  );
}

export default React.memo(CalendarForm);
