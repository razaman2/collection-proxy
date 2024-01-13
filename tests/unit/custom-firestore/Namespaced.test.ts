import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import {Collection} from "../../../src";
import {it, expect, beforeEach} from "vitest";
import {faker} from "@faker-js/faker";

const key = "6LctPUgpAAAAAOjtwApNMK2_sdw8u_QVz_i5yr2c";

const app = firebase.initializeApp({
    projectId: "durand-cutting",
});

firebase.appCheck(app).activate(new firebase.appCheck.ReCaptchaV3Provider(key));

beforeEach(() => {
    Collection.proxy({getFirestore: firebase.firestore});
});

it("should get, create, update, delete document", async () => {
    const id = faker.string.uuid();

    const collection = Collection.proxy().setPath("tests").setDoc(id);

    await collection.init();

    expect(collection.getData("id")).toBeUndefined();

    const name = faker.person.fullName();

    await collection.create({
        data: {name},
    });

    await collection.init();

    expect(collection.getData("name")).toBe(name);

    {
        const name = faker.person.fullName();

        await collection.update({
            data: {name},
        });

        await collection.init();

        expect(collection.getData("name")).toBe(name);

        await collection.update({
            data: {name: undefined},
        });

        await collection.init();

        expect(collection.getData("name")).toBeUndefined();

        await collection.delete();
        await collection.init();

        expect(collection.getData("id")).toBeUndefined();
    }
});
