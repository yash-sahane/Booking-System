export type ApiResponse = {
  success: boolean;
  message?: string;
  data?: any;
};

export type Room = {
  date: Date;
  start_time: string;
  end_time: string;
  room: "Meeting Room" | "Binding Room" | "Printing Room";
  person: string;
  contact: string;
};