export interface IHHHEvent {
  startDate: Date;
  endDate: Date;
  type: string;
  text: string;
  id: number;
}

export interface IHHHBooking extends IHHHEvent {
  dogName: string;
  clientName: string;
  dogId: number;
}
