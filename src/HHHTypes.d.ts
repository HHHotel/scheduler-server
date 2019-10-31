export interface IHoundEvent {
    startDate: number;
    endDate: number;
    type: string;
    text: string;
    id: string;
}

export interface IHoundBooking extends IHoundEvent {
    dogName: string;
    clientName: string;
    dogId: string;
}

export interface IHoundUser {
    id: string;
    username: string;
    permissions: number;
    token: string;
}

export interface IHoundDog {
    name: string;
    clientName: string;
    id: string;
    bookings: IHoundEvent[];
}

declare global {
    namespace Express {
        export interface Request {
            user?: {
                username: string,
                token: string,
                permissions: number,
            };
        }
    }
}