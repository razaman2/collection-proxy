import "../../firebase-init-firestore";
import {describe, afterEach, beforeEach, expect, it} from "vitest";
import {Collection} from "../../../src";
import {app, initializeTestApp} from "@razaman2/collection-testing";
import {faker} from "@faker-js/faker";

describe("Create Documents", () => {
    beforeEach(async () => {
        await initializeTestApp();
    });

    afterEach(async () => {
        await app.config.clearFirestore();
    });

    it("should create document with auto-generated id", async () => {
        expect.assertions(2);

        const collection = Collection.proxy("tests");

        await collection.create();

        await collection.init((snapshot) => {
            expect(snapshot.exists()).toBe(true);
            expect(snapshot.id).toBe(collection.getDoc().id);
        });
    });

    it("should create document with id from setDoc", async () => {
        expect.assertions(2);

        const id = faker.string.uuid();
        const collection = Collection.proxy("tests").setDoc(id);

        await collection.create();

        await collection.init((snapshot) => {
            expect(snapshot.exists()).toBe(true);
            expect(snapshot.id).toBe(id);
        });
    });

    it("should create document with id from payload data", async () => {
        expect.assertions(2);

        const id = faker.string.uuid();
        const collection = Collection.proxy("tests", {
            payload: {
                data: {id},
            },
        });

        await collection.create();

        await collection.init((snapshot) => {
            expect(snapshot.exists()).toBe(true);
            expect(snapshot.id).toBe(id);
        });
    });

    it("should create document with id from document path", async () => {
        expect.assertions(2);

        const id = faker.string.uuid();
        const collection = Collection.proxy().setPath(`tests/${id}`);

        await collection.create();

        await collection.init((snapshot) => {
            expect(snapshot.exists()).toBe(true);
            expect(snapshot.id).toBe(id);
        });
    });

    it("should create document with setPath and setDoc", async () => {
        expect.assertions(2);

        const id = faker.string.uuid();
        const collection = Collection.proxy().setPath("tests").setDoc(id);

        await collection.create();

        await collection.init((snapshot) => {
            expect(snapshot.exists()).toBe(true);
            expect(snapshot.id).toBe(id);
        });
    });
});
