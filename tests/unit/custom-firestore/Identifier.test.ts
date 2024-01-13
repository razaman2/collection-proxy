import "../../firebase-init-firestore";
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {Collection} from "../../../src";
import {doc} from "firebase/firestore";
import {faker} from "@faker-js/faker";
import {app, initializeTestApp} from "@razaman2/collection-testing";

describe("Identifier", () => {
    beforeEach(async () => {
        await initializeTestApp();
    });

    afterEach(async () => {
        await app.config.clearFirestore();
    });

    it("should create with identifier", async () => {
        expect.assertions(1);

        const collection = Collection.proxy();

        await collection.create();
        await collection.init();

        expect(collection.getData("id")).toBe(collection.getDoc().id);
    });

    it("should create with id set on data", async () => {
        expect.assertions(1);

        const id = faker.string.uuid();

        const collection = Collection.proxy({
            payload: {
                data: {id},
            },
        });

        await collection.create();
        await collection.init();

        expect(collection.getData("id")).toBe(id);
    });

    it("should create with id set in create data", async () => {
        expect.assertions(1);

        const id = faker.string.uuid();

        const collection = Collection.proxy();

        await collection.create({
            data: {id},
        });

        await collection.init();

        expect(collection.getData("id")).toBe(id);
    });

    it("should create with id from doc in create params", async () => {
        expect.assertions(1);

        const id = faker.string.uuid();

        const collection = Collection.proxy();

        await collection.create({
            doc: Collection.proxy().getDoc(id),
        });

        await collection.init();

        expect(collection.getData("id")).toBe(id);
    });

    it("should create with id from doc returned from function in create params", async () => {
        expect.assertions(1);

        const id = faker.string.uuid();

        const collection = Collection.proxy();

        await collection.create({
            doc: (ref) => doc(ref, id),
        });

        await collection.init();

        expect(collection.getData("id")).toBe(id);
    });

    it("should create with string id on setDoc", async () => {
        expect.assertions(1);

        const id = faker.string.uuid();

        const collection = Collection.proxy();

        await collection.setDoc(id).create();

        await collection.init();

        expect(collection.getData("id")).toBe(id);
    });

    it("should create with number id on setDoc", async () => {
        expect.assertions(1);

        const id = faker.number.int({min: 1, max: 1000});

        const collection = Collection.proxy();

        await collection.setDoc(id).create();

        await collection.init();

        expect(collection.getData("id")).toBe(id.toString());
    });

    it("should create with doc on setDoc", async () => {
        expect.assertions(1);

        const doc = Collection.proxy().getDoc();

        const collection = Collection.proxy();

        await collection.setDoc(doc).create();

        await collection.init();

        expect(collection.getData("id")).toBe(doc.id);
    });
});
