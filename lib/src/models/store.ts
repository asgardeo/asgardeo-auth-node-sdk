import { Store } from '@asgardeo/auth-js';

export interface NodeStore extends Store{
    getKeys(): Promise<string[]>;
}