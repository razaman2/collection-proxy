import {describe, it, beforeEach, expect} from "vitest";
import {Collection, Updates} from "../../src/index";
import {initializeFirestoreProxy} from "../firebase-init-firestore";
import {getAuth, signInWithEmailAndPassword} from "firebase/auth";
import {arrayUnion, arrayRemove, deleteField, writeBatch, getFirestore} from "firebase/firestore";
import faker from "faker";

beforeEach(async () => {
    initializeFirestoreProxy();

    // await signInWithEmailAndPassword(getAuth(), "user@firestore.com", "password");
});

it("should create role", () => {
    return Collection.proxy("roles").create({
        data: {
            id: "sales",
            name: "Sales",
        },
    });
});

it("should update role", () => {
    return Collection.proxy("roles").update({
        data: {
            id: "sales",
            belongsTo: arrayUnion(`1 users`, `2 users`),
        },
    });
});

it("should delete role", () => {
    return Collection.proxy("roles").setDoc("sales").delete();
});

it("create company", () => {
    return Collection.proxy("companies").create({
        data: {
            name: "Test Company",
        },
    });
});

it("create company settings", () => {
    return Collection.proxy("settings").setParent(Collection.proxy("companies").setDoc("MtKB0iu7OT6W601aZrsR")).create({
        data: {
            status: "active",
        },
    });
});

it("update company settings as super", () => {
    return Collection.proxy("settings").setParent(Collection.proxy("companies").setDoc("MtKB0iu7OT6W601aZrsR")).update({
        merge: false,
        data: {
            id: "GoW7uwOB8WaEkZQaUAZt",
            status: "trial",
            test: true,
        },
    });
});

it("update company settings as admin", async () => {
    return Collection.proxy("settings").setParent(Collection.proxy("companies").setDoc("MtKB0iu7OT6W601aZrsR")).update({
        merge: false,
        data: {
            id: "GoW7uwOB8WaEkZQaUAZt",
            status: "trial",
        },
    });
});
