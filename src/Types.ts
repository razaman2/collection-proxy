import Updates from "./Updates";
import Collection from "./Collection";
import CustomFirestore from "./CustomFirestore";
import {DocumentReference, DocumentSnapshot, Query, QuerySnapshot, Unsubscribe, WriteBatch} from "firebase/firestore";

export type WriteTypes = "create" | "update" | "delete";
export type WriteModes = "lazy" | "eager" | false;

export type Document = {
    [p: string]: any;
    id: string | number;
};

export type ReadCallback<T, U extends CustomFirestore> = (snapshot: T, collection: U) => any;

export type UpdateHandler = Updates | (<T extends CustomFirestore & Collection>(collection: T) => Updates | false) | false;

export type ReadReturnType<T, U> = T extends {
    realtime: false;
} ? Promise<U> : Unsubscribe;

export type DocumentQueryOptions<T extends CustomFirestore> = {
    realtime: boolean;
    callback: ReadCallback<DocumentSnapshot, T>;
};

export type CollectionQueryOptions<T extends CustomFirestore> = {
    group: boolean;
    realtime: boolean;
    query: <T extends Query & Record<string, any>>(ref: T) => Query;
    callback: ReadCallback<QuerySnapshot, T>;
    paginate: false
};

export type CollectionOptions = {
    doc?: DocumentReference;
    batch?: WriteBatch;
    data?: (data: Record<string, any>) => Record<string, any>;
    creator?: Collection;
    logging?: boolean;
};
