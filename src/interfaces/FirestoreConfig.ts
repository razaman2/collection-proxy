import Factory from "@razaman2/js-factory";

export default interface FirestoreConfig {
    [p: string | symbol]: any,

    doc: any,
    getDoc: any,
    getDocs: any,
    setDoc: any,
    updateDoc: any,
    deleteDoc: any,
    collection: any,
    getFirestore: any,
    collectionGroup: any,
    onSnapshot: any,
    serverTimestamp: any,
    writeBatch: any,
    arrayUnion: any,
    arrayRemove: any,
    deleteField: any,
    modular: boolean,
    logging: boolean,
    factory: new(...args: any) => Factory,
}
