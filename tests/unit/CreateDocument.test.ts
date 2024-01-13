import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {initializeTestApp, getCollectionProxy, app} from "@razaman2/collection-proxy-testing";
import faker from "faker";

describe("test document creation", () => {
    beforeEach(async () => {
        await initializeTestApp();
    });

    afterEach(async () => {
        await app.config.clearFirestore();
    });

    it("should create document with default properties", async () => {
        const datetime = new Date("jan 1, 2022");

        const collection = getCollectionProxy({
            params: {
                payload: {
                    data: {createdAt: datetime},
                },
            },
        });

        await collection.create();

        const document = await getCollectionProxy().init(collection.getDoc().id);

        expect(document.getData("id")).toBe(collection.getDoc().id);
        expect(document.getData("belongsTo")).toEqual([`${collection.getDoc().id} ${collection.getCollectionName()}`]);
        expect(document.getData("createdAt").toDate()).toEqual(datetime);
        expect(document.getData("updatedAt").toDate()).toBeInstanceOf(Date);

        expect.assertions(4);
    });

    it("should create document with auto generated id", async () => {
        const collection = getCollectionProxy();

        await collection.create();
        const document = await getCollectionProxy().init(collection.getDoc().id);

        expect(document.getData("id")).toBe(collection.getDoc().id);

        expect.assertions(1);
    });

    it("should create document with id from document data", async () => {
        const id = faker.datatype.uuid();

        const collection = getCollectionProxy({
            params: {
                payload: {
                    data: {id},
                },
            },
        });

        await collection.create();
        const document = await getCollectionProxy().init(id);

        expect(document.getData("id")).toBe(id);

        expect.assertions(1);
    });

    it("should create document with id from custom doc", async () => {
        const id = faker.datatype.uuid();

        const collection = getCollectionProxy();

        await collection.create({
            doc: (ref) => ref.doc(id),
        });

        const document = await getCollectionProxy().init(id);

        expect(document.getData("id")).toBe(id);

        expect.assertions(1);
    });

    it("should create document with id from data passed to create", async () => {
        const id = faker.datatype.uuid();

        const collection = getCollectionProxy();

        await collection.create({
            data: {id},
        });

        const document = await getCollectionProxy().init(id);

        expect(document.getData("id")).toBe(id);

        expect.assertions(1);
    });

    it("should add document id to belongsTo relationship", async () => {
        const collection = getCollectionProxy();

        await collection.create();

        const document = await getCollectionProxy().init(collection.getDoc().id);

        expect(document.getData("belongsTo")).toEqual([`${collection.getDoc().id} tests`]);

        expect.assertions(1);
    });

    it("should create multiple documents", async () => {
        const collection = getCollectionProxy();

        await collection.create({
            data: {id: 1},
        });
        await collection.create({
            data: {id: 2},
        });
        await collection.create({
            data: {id: 3},
        });
        await collection.create({
            data: {id: 4},
        });

        const documents = await getCollectionProxy({
            params: {
                payload: {data: []},
            },
        }).getDocuments({realtime: false});

        [1, 2, 3, 4].forEach((id) => {
            expect(documents.getData().find((item: {id: string}) => {
                return item.id === id.toString();
            }).id).toBe(id.toString());
        });

        expect.assertions(4);
    });
});
