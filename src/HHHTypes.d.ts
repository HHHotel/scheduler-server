export interface HHHEvent {
  startDate: Date;
  endDate: Date;
  type: String;
  text: String;
  id: number;
}

export interface HHHBoarding extends HHHEvent {
  dogName: String;
  clientName: String;
  dogId: number;
}
