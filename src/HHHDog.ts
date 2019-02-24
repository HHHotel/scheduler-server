import {HHHEventDescriptor} from "./HHHEventDescriptor";
import {IHHHBooking, IHHHEvent} from "./HHHTypes";

export class HHHDog {

  public name: string;
  public clientName: string;
  public id: string;
  private bookings: IHHHEvent[];

  constructor(record: any) {

    this.name = record.dog_name;
    this.clientName = record.client_name;
    this.id = record.id;
    this.bookings = [];

  }

  public addBooking(booking: IHHHBooking) {
    this.bookings.push(booking);
  }

}
