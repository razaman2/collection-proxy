import {initializeApp} from "firebase/app";
import {connectAuthEmulator, getAuth} from "firebase/auth";
import firebase from "./firebase.json";

initializeApp({
    apiKey: "1",
    projectId: "demo-app",
});

connectAuthEmulator(getAuth(), `http://${firebase.emulators.auth.host}:${firebase.emulators.auth.port}`);

export {firebase};
