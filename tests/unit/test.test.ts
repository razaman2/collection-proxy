import "../firebase-init-firestore";
import {describe, it, beforeEach, beforeAll} from "vitest";
import EventEmitter from "@razaman2/event-emitter";
import {Collection, Updates, getCollectionRelationship, arrayReplace} from "../../src";
import {getDefaultContext, getAdminContext, initializeTestApp} from "../../../firestore-testing/src";
import Factory from "@razaman2/js-factory";
import {faker} from "@faker-js/faker";
import {arrayUnion, arrayRemove, writeBatch, getFirestore, updateDoc, setDoc, doc, deleteField} from "firebase/firestore";

describe("CustomFirestore - Test", () => {
    beforeEach(async () => {
        await initializeTestApp();
    });

    it("setting arrays", async () => {
        await Collection.proxy().setDoc(123).update({
            data: {
                types: arrayUnion({id: 123}),
            },
        });
    });

    it("should resolve doc", async () => {
        const events = new EventEmitter();

        await getDefaultContext(async (getFirestore) => {
            const batch = getFirestore.batch();

            const user = Collection.proxy("tests", {
                payload: {notifications: events},
            }, {getFirestore}).setDoc(1);

            const email = Collection.proxy("emails").setParent(user);
            const phone = Collection.proxy("phones").setParent(user);
            const settings = Collection.proxy("settings").setParent(user);
            const roles = Collection.proxy("roles").setParent(user);

            events.on("creating", async (collection: any, {batch}: any, data: any) => {
                const setData = (data: any) => {
                    return {batch, data};
                };

                await email.create(setData({address: `${data.firstName}.${data.lastName}@sablecrm.com`}));
                await email.create({
                    ...setData({address: faker.internet.email({provider: "sablecrm.com"})}),
                    doc: (ref) => ref.doc(),
                });
                phone.create(setData({number: "(000) 111 - 2222"}));
                settings.create(setData({status: "active"}));

                await roles.create(setData({id: "super", name: "Super"}));
                await roles.create(setData({id: "admin", name: "Admin"}));
                await roles.create(setData({id: "user", name: "User"}));
            });

            await user.create({batch, data: {firstName: "John", lastName: "Doe"}});
            await batch.commit();

            console.log(batch);
        });

        // await Collection.proxy("demo", {
        //     parent: Collection.proxy("tests"),
        //     creator: Collection.proxy("users").setDoc(1),
        //     owners: [
        //         Collection.proxy("owner1"),
        //         Collection.proxy("owner2", {
        //             parent: Collection.proxy("owner2-parent"),
        //             relationships: (owners) => {
        //                 return owners.filter((owner) => {
        //                     return !/\w+ owner2-parent/.test(owner);
        //                 });
        //             },
        //         }),
        //     ],
        //     factory: TestFactory,
        // }).onWrite({
        //     handler: (collection) => new Updates(collection, {
        //         parent: collection,
        //     }),
        //     triggers: ["create"],
        // }).create({
        //     batch,
        //     data: {
        //         firstName: faker.name.firstName(),
        //         lastName: faker.name.lastName(),
        //     },
        // });
        //
        // await batch.commit();
    });
});

class Demo extends Collection {
    protected transform(data: any) {
        const {firstName, lastName} = data;

        return {
            ...data,
            firstName: firstName.toUpperCase(),
            lastName: lastName.toUpperCase(),
            fullName: `${firstName} ${lastName}`,
        };
    }
}

class TestFactory extends Factory {
    protected getDefaultInstance() {
        return Collection;
    }

    protected getDefaultInstances() {
        return {
            demo: Demo,
        };
    }
}

describe("document write", () => {
    beforeAll(async () => {
        await initializeTestApp();
    });

    it("create super user", () => {
        return getAdminContext(async (getFirestore) => {
            const batch = getFirestore.batch();

            const user = Collection.proxy("users", {getFirestore}).setDoc(1);

            await user.create({
                batch,
                data: {name: faker.person.fullName()},
            });

            await Collection.proxy("roles").setParent(user).setDoc("super").create({batch});
            await batch.commit();
        });
    });

    it("create admin user", () => {
        return getAdminContext(async (getFirestore) => {
            const batch = getFirestore.batch();

            const user = Collection.proxy("users", {getFirestore}).setDoc(2);

            await user.create({
                batch,
                data: {name: faker.person.fullName()},
            });

            await Collection.proxy("roles").setParent(user).setDoc("admin").create({batch});
            await batch.commit();
        });
    });

    it("create company settings", () => {
        return getDefaultContext(async (getFirestore) => {
            const batch = getFirestore.batch();
            const company = Collection.proxy("companies", {getFirestore});
            const settings = Collection.proxy("settings").setParent(company);

            await settings.create({
                batch,
                data: {status: "active"},
            });

            await batch.commit();
        }, {auth: {id: 1}});
    });

    it("update company settings", () => {
        return getDefaultContext(async (getFirestore) => {
            const batch = getFirestore.batch();
            const company = Collection.proxy("companies", {getFirestore}).setDoc("QO5Li1A65cWXUA3I6laU");
            const settings = Collection.proxy("settings").setParent(company).setDoc("aXep3OaAMTrhxEIMax2s");

            await settings.update({
                batch,
                data: {global: {path: "test/user.com"}},
            });

            await batch.commit();
        }, {auth: {id: 2}});
    });
});

describe("events test", () => {
    beforeEach(() => {
    });

    it("create event", () => {
        return Collection.proxy({
            payload: {
                data: {
                    description: "Fire Plans Attached",
                    start: new Date(),
                    end: new Date(),
                    id: "8b8FJYPKdeL2cDpTaGQt",
                    status: "scheduled",
                    timezone: "America/New_York",
                    title: "Planet Fitness - Fire Alarm",
                    type: "install",
                    users: {
                        1: {
                            durations: arrayUnion({
                                description: "Complete Pre-Wire",
                                end: new Date(),
                                id: "3dd5d022-b8c6-40e0-8d56-3e977f4eba26",
                                start: new Date(),
                            }),
                        },
                        2: {
                            durations: arrayUnion({
                                description: "Complete Pre-Wire",
                                end: new Date(),
                                id: "7abb2b97-5ad1-49c8-9f89-6458d2c91bff",
                                start: new Date(),
                            }),
                        },
                    },
                },
            },
            creator: Collection.proxy("users").setDoc(1),
        }).setPath("tests/1/events").onWrite({
            handler: (collection) => new Updates(collection),
            triggers: ["create", "update", "delete"],
        }).setIgnoredPath(["start.", "end.", "users."]).create();
    });

    it("update event", async () => {
        const collection = await Collection.proxy("events", {
            creator: Collection.proxy("users").setDoc(1),
        }).onWrite({
            handler: (collection) => new Updates(collection, {payload: {logging: false}}),
            triggers: ["create", "update", "delete"],
        }).setPath("tests/1/events").setIgnoredPath(["start.", "end.", "users."]).init("8b8FJYPKdeL2cDpTaGQt");

        const duration = collection.getData("users.1.durations", []).find((duration: {id: string}) => {
            return duration.id === "3dd5d022-b8c6-40e0-8d56-3e977f4eba26";
        });

        const batch = writeBatch(getFirestore());

        // await collection.update({
        //     batch,
        //     data: {
        //         users: {
        //             1: {
        //                 durations: arrayUnion({
        //                     description: "Complete Pre-Wire",
        //                     end: new Date(),
        //                     id: "3dd5d022-b8c6-40e0-8d56-3e977f4eba26",
        //                     start: new Date(),
        //                 }),
        //             },
        //         },
        //     },
        // });

        await collection.update({
            batch,
            data: {
                users: {
                    1: {
                        durations: arrayUnion({
                            ...duration,
                            enroute: new Date(),
                        }),
                    },
                    2: {
                        durations: arrayUnion({
                            description: "Complete Pre-Wire",
                            end: new Date(),
                            id: "111",
                            start: new Date(),
                        }),
                    },
                },
            },
        });

        await collection.update({
            batch,
            update: false,
            data: {
                users: {
                    1: {durations: arrayRemove(duration)},
                },
            },
        });

        await batch.commit();
    });
});
