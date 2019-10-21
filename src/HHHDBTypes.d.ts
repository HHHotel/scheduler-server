import {Pool, PoolConfig} from "mysql";

export interface ISQLUser {
    id: string;
    username: string;
    hashed_password: string;
    permissions: number;
    token: number;
    token_timestamp: number;
}

export interface ISQLDog {
    id: string;
    dog_name: string;
    client_name: string;
}

export interface ISQLEvent extends ISQLDog {
    event_id: string;
    event_type: string;
    event_text: string;
    event_start: string;
    event_end: string;
}

export interface IDatabase {
    pool: Pool;
    connOpts: PoolConfig;
}