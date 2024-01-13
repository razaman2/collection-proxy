import "../../firebase-init-firestore";
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {Collection, Updates} from "../../../src";
import {arrayRemove, arrayUnion, getFirestore, writeBatch, deleteField} from "firebase/firestore";
import {initializeTestApp, app} from "@razaman2/collection-testing";
import {faker} from "@faker-js/faker";

describe("array updates", () => {
    beforeEach(async () => {
        await initializeTestApp();
    });

    afterEach(async () => {
        await app.config.clearFirestore();
    });

    it("should create update when creating arrayUnion numbers", async () => {
        const id = faker.string.uuid();
        const batch = writeBatch(getFirestore());

        const collection = Collection.proxy({
            creator: Collection.proxy(),
        }).onWrite({
            handler: (collection) => new Updates(collection, {
                parent: collection,
            }).setDoc(id),
            triggers: ["create", "update", "delete"],
        });

        await collection.create({
            batch,
            data: {
                options: arrayUnion(0, 1, 2, 3),
            },
        });

        await batch.commit();

        expect((await Collection.proxy("updates", {
            parent: collection,
        }).init(id)).getData("after.options")).toEqual([0, 1, 2, 3]);
    });

    it("should create update when creating arrayUnion strings", async () => {
        const id = faker.string.uuid();
        const batch = writeBatch(getFirestore());

        const collection = Collection.proxy({
            creator: Collection.proxy(),
        }).onWrite({
            handler: (collection) => new Updates(collection, {
                parent: collection,
            }).setDoc(id),
            triggers: ["create", "update", "delete"],
        });

        await collection.create({
            batch,
            data: {
                options: arrayUnion("zero", "one", "two", "three"),
            },
        });

        await batch.commit();

        expect((await Collection.proxy("updates", {
            parent: collection,
        }).init(id)).getData("after.options")).toEqual(["zero", "one", "two", "three"]);
    });

    it("should create update when creating arrayUnion objects", async () => {
        const id = faker.string.uuid();
        const batch = writeBatch(getFirestore());

        const collection = Collection.proxy({
            creator: Collection.proxy(),
        }).onWrite({
            handler: (collection) => new Updates(collection, {
                parent: collection,
            }).setDoc(id),
            triggers: ["create", "update", "delete"],
        });

        await collection.create({
            batch,
            data: {
                options: arrayUnion(
                    {
                        name: "zero",
                        id: 0,
                    },
                    {
                        name: "one",
                        id: 1,
                    },
                ),
            },
        });

        await batch.commit();

        expect((await Collection.proxy("updates", {
            parent: collection,
        }).init(id)).getData("after.options")).toEqual([
            {
                name: "zero",
                id: 0,
            },
            {
                name: "one",
                id: 1,
            },
        ]);
    });

    it("should create update when replacing array objects", async () => {
        const batch = writeBatch(getFirestore());

        const collection = Collection.proxy({
            creator: Collection.proxy(),
        });

        await collection.create({
            batch,
            update: () => new Updates(collection, {
                parent: collection,
            }).setDoc("create"),
            data: {
                test: true,
                options: arrayUnion(
                    {
                        name: "zero",
                        id: 0,
                    },
                    {
                        name: "one",
                        id: 1,
                    },
                ),
            },
        });

        await batch.commit();
        await collection.init();
        const update1 = await Collection.proxy("updates").setParent(collection).init("create");

        expect(collection.getData("test")).toBe(true);
        expect(collection.getData("options")).toHaveLength(2);
        expect(collection.getData("options").find((item: any) => item.id === 0)).toEqual({name: "zero", id: 0});
        expect(collection.getData("options").find((item: any) => item.id === 1)).toEqual({name: "one", id: 1});

        expect(update1.getData("before")).toEqual({});
        expect(update1.getData("after.test")).toBe(true);
        expect(update1.getData("after.options")).toHaveLength(2);
        expect(update1.getData("after.options").find((item: any) => item.id === 0)).toEqual({name: "zero", id: 0});
        expect(update1.getData("after.options").find((item: any) => item.id === 1)).toEqual({name: "one", id: 1});

        {
            const batch = writeBatch(getFirestore());

            await collection.update({
                batch,
                update: () => new Updates(collection, {
                    parent: collection,
                }).setDoc("update"),
                data: {
                    test: false,
                    options: arrayUnion({
                        name: 1,
                        id: 1,
                    }),
                },
            });

            await collection.update({
                batch,
                update: false,
                data: {
                    options: arrayRemove({
                        name: "one",
                        id: 1,
                    }),
                },
            });

            await batch.commit();
            await collection.init();

            expect(collection.getData("test")).toBe(false);
            expect(collection.getData("options")).toHaveLength(2);
            expect(collection.getData("options").find((item: any) => item.id === 0)).toEqual({name: "zero", id: 0});
            expect(collection.getData("options").find((item: any) => item.id === 1)).toEqual({name: 1, id: 1});

            const update2 = await Collection.proxy("updates").setParent(collection).init("update");

            expect(update2.getData("before.test")).toBe(true);
            expect(update2.getData("before.options")).toHaveLength(2);
            expect(update2.getData("before.options").find((item: any) => item.id === 0)).toEqual({name: "zero", id: 0});
            expect(update2.getData("before.options").find((item: any) => item.id === 1)).toEqual({name: "one", id: 1});

            expect(update2.getData("after.test")).toBe(false);
            expect(update2.getData("after.options")).toHaveLength(2);
            expect(update2.getData("after.options").find((item: any) => item.id === 0)).toEqual({name: "zero", id: 0});
            expect(update2.getData("after.options").find((item: any) => item.id === 1)).toEqual({name: 1, id: 1});
        }
    });

    it("should create update for arrayRemove numbers", async () => {
        const id = faker.string.uuid();
        const batch = writeBatch(getFirestore());

        const collection = Collection.proxy({
            creator: Collection.proxy(),
        }).onWrite({
            handler: (collection) => new Updates(collection, {
                parent: collection,
            }).setDoc(id),
            triggers: ["create", "update", "delete"],
        });

        await collection.create({
            batch,
            data: {
                options: arrayUnion(0, 1),
            },
        });

        await batch.commit();

        expect((await Collection.proxy("updates", {
            parent: collection,
        }).init(id)).getData("after.options")).toEqual([0, 1]);

        {
            const batch = writeBatch(getFirestore());

            await (await collection.init()).update({
                batch,
                data: {
                    options: arrayRemove(0),
                },
            });

            await batch.commit();
        }

        expect((await Collection.proxy("updates", {
            parent: collection,
        }).init(id)).getData("before.options")).toEqual([0, 1]);

        expect((await Collection.proxy("updates", {
            parent: collection,
        }).init(id)).getData("after.options")).toEqual([1]);
    });

    it("should create update for arrayRemove strings", async () => {
        const id = faker.string.uuid();
        const batch = writeBatch(getFirestore());

        const collection = Collection.proxy({
            creator: Collection.proxy(),
        }).onWrite({
            handler: (collection) => new Updates(collection, {
                parent: collection,
            }).setDoc(id),
            triggers: ["create", "update", "delete"],
        });

        await collection.create({
            batch,
            data: {
                options: arrayUnion("zero", "one"),
            },
        });

        await batch.commit();

        expect((await Collection.proxy("updates", {
            parent: collection,
        }).init(id)).getData("after.options")).toEqual(["zero", "one"]);

        {
            const batch = writeBatch(getFirestore());

            await (await collection.init()).update({
                batch,
                data: {
                    options: arrayRemove("zero"),
                },
            });

            await batch.commit();
        }

        expect((await Collection.proxy("updates", {
            parent: collection,
        }).init(id)).getData("before.options")).toEqual(["zero", "one"]);

        expect((await Collection.proxy("updates", {
            parent: collection,
        }).init(id)).getData("after.options")).toEqual(["one"]);
    });

    it("should create update for arrayRemove objects", async () => {
        const id = faker.string.uuid();
        const batch = writeBatch(getFirestore());

        const collection = Collection.proxy({
            creator: Collection.proxy(),
        }).onWrite({
            handler: (collection) => new Updates(collection, {
                parent: collection,
            }).setDoc(id),
            triggers: ["create", "update", "delete"],
        });

        await collection.create({
            batch,
            data: {
                options: arrayUnion(
                    {
                        name: "zero",
                        id: 0,
                    },
                    {
                        name: "one",
                        id: 1,
                    },
                ),
            },
        });

        await batch.commit();

        expect((await Collection.proxy("updates", {
            parent: collection,
        }).init(id)).getData("after.options")).toEqual([
            {
                name: "zero",
                id: 0,
            },
            {
                name: "one",
                id: 1,
            },
        ]);

        {
            const batch = writeBatch(getFirestore());

            await (await collection.init()).update({
                batch,
                data: {
                    options: arrayRemove({
                        name: "zero",
                        id: 0,
                    }),
                },
            });

            await batch.commit();
        }

        expect((await Collection.proxy("updates", {
            parent: collection,
        }).init(id)).getData("before.options")).toEqual([
            {
                name: "zero",
                id: 0,
            },
            {
                name: "one",
                id: 1,
            },
        ]);

        expect((await Collection.proxy("updates", {
            parent: collection,
        }).init(id)).getData("after.options")).toEqual([
            {
                name: "one",
                id: 1,
            },
        ]);
    });

    it("should add and remove array items in same batch", async () => {
        const collection = Collection.proxy({
            creator: Collection.proxy(),
        });

        await collection.create({
            data: {
                options: arrayUnion(0, 1, 2, 3, 4, 5),
            },
        });

        expect(await (await collection.init()).getData("options")).toEqual([0, 1, 2, 3, 4, 5]);

        const batch = writeBatch(getFirestore());

        const update = new Updates(collection, {
            parent: collection,
        });

        await collection.update({
            batch,
            update,
            data: {
                options: arrayRemove(5),
            },
        });

        await collection.update({
            batch,
            update,
            data: {
                options: arrayUnion(6),
            },
        });

        await batch.commit();

        expect(await (await collection.init()).getData("options")).toEqual([0, 1, 2, 3, 4, 6]);
    });

    it("should properly create update for document creations", async () => {
        const id = faker.string.uuid();
        const batch = writeBatch(getFirestore());

        const collection = Collection.proxy({
            creator: Collection.proxy(),
        }).onWrite({
            handler: (collection) => new Updates(collection, {
                parent: collection,
            }).setDoc(id),
            triggers: ["create"],
        });

        await collection.create({batch});
        await batch.commit();

        const update = await Collection.proxy("updates", {
            parent: collection,
        }).setIgnoredPath(/^(before|after)\./).init(id);

        expect(update.getData("before")).toEqual({});

        expect(update.getData("after.createdAt").toDate()).toBeInstanceOf(Date);
        expect(update.getData("after.updatedAt").toDate()).toBeInstanceOf(Date);
    });

    it("should properly create update for document updates", async () => {
        const id = faker.string.uuid();
        const batch = writeBatch(getFirestore());

        const collection = Collection.proxy({
            creator: Collection.proxy(),
        }).onWrite({
            handler: (collection) => new Updates(collection, {
                parent: collection,
            }).setDoc(id),
            triggers: ["update"],
        });

        await collection.create({
            batch,
            data: {
                deleted: false,
            },
        });

        await batch.commit();

        {
            const batch = writeBatch(getFirestore());

            await (await collection.init()).update({
                batch,
                data: {
                    updated: true,
                    deleted: deleteField(),
                },
            });

            await batch.commit();

            const update = await Collection.proxy("updates", {
                parent: collection,
            }).setIgnoredPath(/^(before|after)\./).init(id);

            expect(update.getData("before.createdAt").toDate()).toBeInstanceOf(Date);
            expect(update.getData("before.updatedAt").toDate()).toBeInstanceOf(Date);
            expect(update.getData("before.updated")).toBe("${empty}");
            expect(update.getData("before.deleted")).toBe(false);

            expect(update.getData("after.updatedAt").toDate()).toBeInstanceOf(Date);
            expect(update.getData("after.updated")).toBe(true);
            expect(update.getData("after.deleted")).toBe("${deleted}");
        }
    });

    it("should properly create update for document deletions", async () => {
        const id = faker.string.uuid();
        const batch = writeBatch(getFirestore());

        const collection = Collection.proxy({
            creator: Collection.proxy(),
        }).onWrite({
            handler: (collection) => new Updates(collection, {
                parent: collection,
            }).setDoc(id),
            triggers: ["delete"],
        });

        await collection.create({batch});
        await batch.commit();

        {
            const batch = writeBatch(getFirestore());

            await (await collection.init()).delete({batch});
            await batch.commit();

            const update = await Collection.proxy("updates", {
                parent: collection,
            }).setIgnoredPath(/^(before|after)\./).init(id);

            expect(update.getData("before.createdAt").toDate()).toBeInstanceOf(Date);
            expect(update.getData("before.updatedAt").toDate()).toBeInstanceOf(Date);

            expect(update.getData("after")).toEqual({});
        }
    });
});
