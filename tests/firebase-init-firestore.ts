import "./firebase-init-auth";
import {Collection} from "../src";
import {connectFirestoreEmulator, getFirestore, collection, collectionGroup, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, serverTimestamp, deleteField, onSnapshot, writeBatch} from "firebase/firestore";
import firebase from "./firebase.json";

connectFirestoreEmulator(getFirestore(), firebase.emulators.firestore.host, firebase.emulators.firestore.port);

Collection.proxy({
    modular: true,
    getFirestore: getFirestore(),
    collection,
    collectionGroup,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    deleteField,
    onSnapshot,
    writeBatch,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
});
