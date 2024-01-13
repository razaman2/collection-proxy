import "../../firebase-init-firestore";
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {Collection} from "../../../src";
import {initializeTestApp, getAdminContext, app} from "@razaman2/firestore-testing";
import {faker} from "@faker-js/faker";

describe("test read", () => {
    beforeEach(async () => {
        await initializeTestApp();
    });

    afterEach(async () => {
        await app.config.clearFirestore();
    });

    it("should replace undefined with custom value when updating", async () => {
        const collection = Collection.proxy("tests");

        await collection.create({data: {name: "jane doe"}});
        await collection.init();

        expect(collection.getData("name")).toBe("jane doe");

        await collection.update({data: {name: undefined}});
        await collection.init();

        expect(collection.getData("name")).toBeUndefined();
    });

    it("should replace undefined with custom value when creating", async () => {
        const collection = Collection.proxy("tests");

        await collection.create({
            merge: true,
            data: {
                firstName: "jane",
                lastName: "doe",
                name: undefined,
            },
        });

        await collection.init();

        expect(collection.getData()).not.toHaveProperty("name");
        expect(collection.getData("firstName")).toBe("jane");
        expect(collection.getData("lastName")).toBe("doe");
    });

    it("should create super role without permissions", () => {
        return Collection.proxy("roles").create({
            data: {
                id: "super",
                name: "Super",
            },
        });
    });

    it("should create super user", () => {
        return getAdminContext(async (getFirestore) => {
            const batch = getFirestore.batch();

            const user = Collection.proxy("users", {
                payload: {
                    data: {
                        id: 1,
                        firstName: faker.person.firstName(),
                        lastName: faker.person.lastName(),
                    },
                },
            }, {getFirestore});

            await Promise.all([
                user.create({batch}),

                Collection.proxy("roles").setParent(user).setDoc("super").create({batch}),

                Collection.proxy("roles").create({
                    batch,
                    data: {
                        id: "super",
                        name: "Super",
                    },
                }),

                Collection.proxy("settings").setParent(user).create({
                    batch,
                    data: {
                        id: user.getDoc().id,
                        status: "active",
                        path: `user/${user.getDoc().id}`,
                    },
                }),
            ]);

            await batch.commit();
        });
    });
});
