import CollectionInterface from "./CollectionInterface";
import {
    CollectionReference,
    DocumentSnapshot,
    QueryDocumentSnapshot,
    DocumentReference,
    Timestamp
} from "firebase/firestore";

export default interface Collection {
    create(params: CollectionInterface): any;

    update(params: CollectionInterface): any;

    remove(params: CollectionInterface): any;

    getCollection(): CollectionReference;

    getCollectionName(): string;

    getPayload(params?: CollectionInterface): Record<string, any>;

    getDocument(id: ((data: Record<string, any>) => string) | string, callback?: (snapshot: DocumentSnapshot) => any): DocumentReference;

    getDocuments(params?: any): QueryDocumentSnapshot;

    getDoc(): DocumentReference;

    getDocumentOwners(): Array<string>;

    getTimestamp(date?: any): Timestamp;

    isDocumentExists(): boolean;

    isShouldUpdate(data: Record<string, any>): boolean;

    isDatabaseRecord(data: Record<string, any>): boolean;

    isDatabaseRecord(handler: (data: Record<string, any>) => Record<string, any>): boolean;

    // getFirestore(): Firestore;
}
