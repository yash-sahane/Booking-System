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

    const currentDate = new Date().toISOString().split('T')[0];
    // const selectedDate = new Date(date);
    // const selectedStartTime = new Date(
    //   `${selectedDate.toDateString()} ${startTime}`
    // );
    // const selectedEndTime = new Date(
    //   `${selectedDate.toDateString()} ${endTime}`
    // );

    // Check if the selected date is in the past
    // if (
    //   selectedDate.getDate() !== currentDate.getDate() &&
    //   selectedDate < currentDate
    // ) {
    //   toast.error("You can't book a meeting room for a past date.");
    //   return;
    // }

    // // Check if the selected start time is in the past
    // if (selectedStartTime < currentDate) {
    //   toast.error("You can't book a meeting room for a past start time.");
    //   return;
    // }

    // // Check if the end time is earlier than the start time
    // if (selectedEndTime <= selectedStartTime) {
    //   toast.error("End time must be later than start time.");
    //   return;
    // }

    if (date < currentDate) {
      toast.error("You can't book for a past date.");
      return;
    }

    // Fetch existing bookings for the room and date
    const { data: existingBookingsData } = await axios.post<ApiResponse>(
      `${import.meta.env.VITE_SERVER_URI}/api/room/`,
      { roomName: room, date }
    );

    if (existingBookingsData.success) {
      const existingBookings = existingBookingsData.data;

      const isOverlapping = existingBookings.some((booking: any) => {
        const bookingStartTime = new Date(`${booking.date} ${booking.start_time}`);
        const bookingEndTime = new Date(`${booking.date} ${booking.end_time}`);
        const selectedStartTime = new Date(`${date} ${startTime}`);
        const selectedEndTime = new Date(`${date} ${endTime}`);

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

    // api call
    try {
      const { data: addBookingData } = await axios.post<ApiResponse>(
        `${import.meta.env.VITE_SERVER_URI}/api/room/addBooking`,
        { date, startTime, endTime, roomName: room, person, contact }
      );
      if (addBookingData.success) {
        toast.success(addBookingData.message!);

        // Clear form fields on successful submission
        form.reset();
        setPerson(""); // Clear other state variables if necessary
        setContact("");
      }

      // fetch new bookings on success
      const { data: fetchBookingData } = await axios.post<ApiResponse>(
        `${import.meta.env.VITE_SERVER_URI}/api/room`,
        { roomName: room, date }
      );
      if (fetchBookingData.success) {
        setBookings(fetchBookingData.data);
      }
    } catch (e: any) {
      console.log(e);
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
