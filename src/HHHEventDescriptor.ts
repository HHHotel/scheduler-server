import {IHHHBooking, IHHHEvent} from "./HHHTypes";

export class HHHEventDescriptor {

  public startDate: number;
  public endDate: number;
  public id: number;
  public eventId: number;
  public eventText: string;
  public eventType: string;
  public dogName: string;
  public clientName: string;

  constructor( eventDescriptor: any ) {

    this.startDate = parseInt(eventDescriptor.event_start, 10);
    this.endDate = parseInt(eventDescriptor.event_end, 10);
    this.id = eventDescriptor.id;
    this.eventId = eventDescriptor.event_id;
    this.eventText = eventDescriptor.event_text;
    this.eventType = eventDescriptor.event_type;
    this.dogName = eventDescriptor.dog_name;
    this.clientName = eventDescriptor.client_name;

  }

  public getHHHEvent(): IHHHEvent {
    const event: IHHHEvent = {
      endDate: new Date(this.endDate),
      id: this.eventId,
      startDate: new Date(this.startDate),
      text: this.eventText,
      type: this.eventType,
    };

    if (this.dogName) {
      (event as IHHHBooking).dogId = this.id;
      (event as IHHHBooking).dogName = this.dogName;
      (event as IHHHBooking).clientName = this.clientName;
    }

    return event;
  }

}
