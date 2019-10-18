export interface IHoundApiDog {
    name: string;
    clientName: string;
    id: string;
    bookings: IHoundApiEvent[];
}

export interface IHoundApiBooking extends IHoundApiEvent {
    dogId: string;
}

export interface IHoundApiEvent {
    startDate: number;
    endDate: number;
    type: string;
    text: string;
    id: string;
}
