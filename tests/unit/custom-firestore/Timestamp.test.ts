import "../../firebase-init-firestore";
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {Timestamp} from "firebase/firestore";
import {Collection} from "../../../src";
import {faker} from "@faker-js/faker";
import {app, initializeTestApp} from "@razaman2/collection-testing";

describe("Timestamp", () => {
    beforeEach(async () => {
        await initializeTestApp();
    });

    afterEach(async () => {
        await app.config.clearFirestore();
    });

    it("should create with serverTimestamp", async () => {
        const collection = Collection.proxy();

        await collection.create();
        await collection.init();

        expect(collection.getData("createdAt").toDate()).toBeInstanceOf(Date);
    });

    it("should create with Timestamp set on data", async () => {
        const datetime = faker.date.between({from: "1985-01-01", to: new Date});

        const collection = Collection.proxy({
            payload: {
                data: {
                    createdAt: Timestamp.fromDate(datetime),
                },
            },
        });

        await collection.create();
        await collection.init();

        expect(collection.getData("createdAt").toDate()).toEqual(datetime);
    });

    it("should create with javascript Date set on data", async () => {
        const datetime = faker.date.between({from: "1985-01-01", to: new Date});

        const collection = Collection.proxy({
            payload: {
                data: {
                    createdAt: datetime,
                },
            },
        });

        await collection.create();
        await collection.init();

        expect(collection.getData("createdAt").toDate()).toEqual(datetime);
    });

    it("should create with javascript Date set using setData method", async () => {
        const datetime = faker.date.between({from: "1985-01-01", to: new Date});

        const collection = Collection.proxy();

        collection.setData({createdAt: datetime});

        await collection.create();
        await collection.init();

        expect(collection.getData("createdAt").toDate()).toEqual(datetime);
    });

    it("should create with function that returns javascript Date set on data", async () => {
        const datetime = faker.date.between({from: "1985-01-01", to: new Date});

        const collection = Collection.proxy({
            payload: {
                data: {
                    createdAt: () => {
                        return datetime;
                    },
                },
            },
        });

        await collection.create();
        await collection.init();

        expect(collection.getData("createdAt").toDate()).toEqual(datetime);
    });

    it("should create with function that returns Timestamp set on data", async () => {
        const datetime = faker.date.between({from: "1985-01-01", to: new Date});

        const collection = Collection.proxy({
            payload: {
                data: {
                    createdAt: () => {
                        return Timestamp.fromDate(datetime);
                    },
                },
            },
        });

        await collection.create();
        await collection.init();

        expect(collection.getData("createdAt").toDate()).toEqual(datetime);
    });

    it("should create with Timestamp in create data", async () => {
        const datetime = faker.date.between({from: "1985-01-01", to: new Date});

        const collection = Collection.proxy();

        await collection.create({
            data: {
                createdAt: Timestamp.fromDate(datetime),
            },
        });

        await collection.init();

        expect(collection.getData("createdAt").toDate()).toEqual(datetime);
    });

    it("should create with javascript Date in create data", async () => {
        const datetime = faker.date.between({from: "1985-01-01", to: new Date});

        const collection = Collection.proxy();

        await collection.create({
            data: {
                createdAt: datetime,
            },
        });

        await collection.init();

        expect(collection.getData("createdAt").toDate()).toEqual(datetime);
    });

    it("should create with function that returns Timestamp in create data", async () => {
        const datetime = faker.date.between({from: "1985-01-01", to: new Date});

        const collection = Collection.proxy();

        await collection.create({
            data: {
                createdAt: () => {
                    return Timestamp.fromDate(datetime);
                },
            },
        });

        await collection.init();

        expect(collection.getData("createdAt").toDate()).toEqual(datetime);
    });

    it("should create with function that returns javascript Date in create data", async () => {
        const datetime = faker.date.between({from: "1985-01-01", to: new Date});

        const collection = Collection.proxy();

        await collection.create({
            data: {
                createdAt: () => {
                    return datetime;
                },
            },
        });

        await collection.init();

        expect(collection.getData("createdAt").toDate()).toEqual(datetime);
    });
});
