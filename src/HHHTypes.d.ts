import {Pool, PoolConfig} from "mysql";

export interface HHHEvent {
    startDate: Date;
    endDate: Date;
    type: string;
    text: string;
    id: string;
}

export interface HHHBooking extends HHHEvent {
    dogName: string;
    clientName: string;
    dogId: string;
}

export interface HHHUser {
    id: string;
    username: string;
    permissions: number;
}

export interface HHHDog {
    name: string;
    clientName: string;
    id: string;
    bookings: HHHEvent[];
}

export interface HHHSQLUser {
    id: string;
    username: string;
    permissions: number;
    token: number;
    token_timestamp: number;
}

export interface HHHSQLDog {
    id: string;
    dog_name: string;
    client_name: string;
}

export interface HHHSQLEvent extends HHHSQLDog {
    event_id: string;
    event_type: string;
    event_text: string;
    event_start: string;
    event_end: string;
}

export interface SchedulerEvent {
    text: string;
    type: string;
    desc: string;
    dogId: string;
    eventId: string;
    startDate: Date;
    endDate: Date;
}

export interface Database {
    pool: Pool;
    connOpts: PoolConfig;
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
