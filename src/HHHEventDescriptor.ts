import {HHHEvent, HHHBoarding} from './HHHTypes';

export class HHHEventDescriptor {

  start_date: number;
  end_date: number;
  id: number;
  event_id: number;
  event_text: String;
  event_type: String;
  dog_name: String;
  client_name: String;

  constructor ( eventDescriptor : any ) {

    this.start_date = parseInt(eventDescriptor.event_start);
    this.end_date = parseInt(eventDescriptor.event_end);
    this.id = eventDescriptor.id;
    this.event_id = eventDescriptor.event_id;
    this.event_text = eventDescriptor.event_text;
    this.event_type = eventDescriptor.event_type;
    this.dog_name = eventDescriptor.dog_name;
    this.client_name = eventDescriptor.client_name;

  }

  getHHHEvent(): HHHEvent {
    let event: HHHEvent = {
      startDate: new Date(this.start_date),
      endDate: new Date(this.end_date),
      text: this.event_text,
      type: this.event_type,
      id: this.event_id
    }

    if (this.dog_name) {
      (event as HHHBoarding).dogId = this.id;
      (event as HHHBoarding).dogName = this.dog_name;
      (event as HHHBoarding).clientName = this.client_name;
    }

    return event;
  }



}
