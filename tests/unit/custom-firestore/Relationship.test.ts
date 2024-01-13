import "../../firebase-init-firestore";
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {initializeTestApp, app} from "@razaman2/firestore-testing";
import {arrayUnion} from "firebase/firestore";
import {Collection} from "../../../src";
import {faker} from "@faker-js/faker";

describe("Relationship", () => {
    beforeEach(async () => {
        await initializeTestApp();
    });

    afterEach(async () => {
        await app.config.clearFirestore();
    });

    it("should create with single relationship that matches `id collection`", async () => {
        expect.assertions(2);

        const collection = Collection.proxy();

        await collection.create();
        await collection.init();

        expect(collection.getData("belongsTo")).toHaveLength(1);
        expect(collection.getData("belongsTo")).toContain(`${collection.getDoc().id} ${collection.getCollectionName()}`);
    });

    it("should append relationships array set on data", async () => {
        expect.assertions(3);

        const relationship = `${faker.string.uuid()} tests`;

        const collection = Collection.proxy({
            payload: {
                data: {
                    belongsTo: [relationship],
                },
            },
        });

        await collection.create();
        await collection.init();

        expect(collection.getData("belongsTo")).toHaveLength(2);
        expect(collection.getData("belongsTo")).toContain(`${collection.getDoc().id} ${collection.getCollectionName()}`);
        expect(collection.getData("belongsTo")).toContain(relationship);
    });

    it("should append relationships returned from function set on data", async () => {
        expect.assertions(3);

        const relationship = `${faker.string.uuid()} tests`;

        const collection = Collection.proxy({
            payload: {
                data: {
                    belongsTo: (owners: Array<string>) => {
                        return owners.concat(relationship);
                    },
                },
            },
        });

        await collection.create();
        await collection.init();

        expect(collection.getData("belongsTo")).toHaveLength(2);
        expect(collection.getData("belongsTo")).toContain(`${collection.getDoc().id} ${collection.getCollectionName()}`);
        expect(collection.getData("belongsTo")).toContain(relationship);
    });

    it("should append relationships returned from arrayUnion set on data", async () => {
        expect.assertions(3);

        const relationship = `${faker.string.uuid()} tests`;

        const collection = Collection.proxy({
            payload: {
                data: {
                    belongsTo: arrayUnion(relationship),
                },
            },
        });

        await collection.create();
        await collection.init();

        expect(collection.getData("belongsTo")).toHaveLength(2);
        expect(collection.getData("belongsTo")).toContain(`${collection.getDoc().id} ${collection.getCollectionName()}`);
        expect(collection.getData("belongsTo")).toContain(relationship);
    });

    it("should append relationships array in create data", async () => {
        expect.assertions(3);

        const relationship = `${faker.string.uuid()} tests`;
        const collection = Collection.proxy();

        await collection.create({
            data: {
                belongsTo: [relationship],
            },
        });

        await collection.init();

        expect(collection.getData("belongsTo")).toHaveLength(2);
        expect(collection.getData("belongsTo")).toContain(`${collection.getDoc().id} ${collection.getCollectionName()}`);
        expect(collection.getData("belongsTo")).toContain(relationship);
    });

    it("should append relationships returned from function in create data", async () => {
        expect.assertions(3);

        const relationship = `${faker.string.uuid()} tests`;
        const collection = Collection.proxy();

        await collection.create({
            data: {
                belongsTo: (owners: Array<string>) => {
                    return owners.concat(relationship);
                },
            },
        });

        await collection.init();

        expect(collection.getData("belongsTo")).toHaveLength(2);
        expect(collection.getData("belongsTo")).toContain(`${collection.getDoc().id} ${collection.getCollectionName()}`);
        expect(collection.getData("belongsTo")).toContain(relationship);
    });

    it("should append relationships returned from arrayUnion in create data", async () => {
        expect.assertions(3);

        const relationship = `${faker.string.uuid()} tests`;
        const collection = Collection.proxy();

        await collection.create({
            data: {
                belongsTo: arrayUnion(relationship),
            },
        });

        await collection.init();

        expect(collection.getData("belongsTo")).toHaveLength(2);
        expect(collection.getData("belongsTo")).toContain(`${collection.getDoc().id} ${collection.getCollectionName()}`);
        expect(collection.getData("belongsTo")).toContain(relationship);
    });
});
