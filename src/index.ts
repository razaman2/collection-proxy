import Updates from "./Updates";
import Collection from "./Collection";
import CustomFirestore from "./CustomFirestore";
import {SetOptions} from "firebase/firestore";
import type CollectionInterface from "./interfaces/CollectionInterface";
import type CollectionParams from "./interfaces/CollectionParams";
import type FirestoreConfig from "./interfaces/FirestoreConfig";
import type {CollectionOptions, Document, WriteTypes} from "./Types";

export default CustomFirestore;

export {Updates, Collection};

export type {CollectionParams, CollectionInterface, FirestoreConfig, WriteTypes};

export function ResolveConfig(config: Partial<FirestoreConfig>): typeof config {
    const modular = (CustomFirestore.getConfig().modular || config.modular);

    return ((typeof modular === "boolean") && modular) ? config : CompatConfig(config);
}

function CompatConfig(config: Partial<FirestoreConfig>): Partial<FirestoreConfig> {
    return {
        getFirestore: CustomFirestore.getConfig().getFirestore ?? config.getFirestore,
        doc: (ref: any, path: string, id: string) => {
            if (id) {
                return ref.collection(`${path}`).doc(`${id}`);
            } else if (ref.doc) {
                return path ? ref.doc(`${path}`) : ref.doc();
            } else {
                return ref;
            }
        },
        getDocs: (ref: any) => ref.get(),
        getDoc: (ref: any) => ref.get(),
        setDoc: (ref: any, payload: Partial<Record<string, any>>, options: SetOptions) => ref.set(payload, options),
        updateDoc: (ref: any, payload: Partial<Record<string, any>>) => ref.update(payload),
        deleteDoc: (ref: any) => ref.delete(),
        deleteField: () => {
            try {
                return (config.getFirestore ?? CustomFirestore.getConfig().getFirestore).FieldValue.delete();
            } catch {
                return null;
            }
        },
        collection: (ref: any, ...segments: Array<string>) => ref.collection(segments.join("/")),
        collectionGroup: (ref: any, name: string) => ref.collectionGroup(name),
        serverTimestamp: () => {
            try {
                return (config.getFirestore ?? CustomFirestore.getConfig().getFirestore).FieldValue.serverTimestamp();
            } catch {
                return new Date();
            }
        },
        arrayUnion: (...params: Array<any>) => {
            try {
                return (config.getFirestore ?? CustomFirestore.getConfig().getFirestore).FieldValue.arrayUnion(...params);
            } catch {
                return Array.from(new Set(params.reduce((items: Array<any>, item) => {
                    return items.concat(item);
                }, [])));
            }
        },
        arrayRemove: (...params: Array<any>) => {
            try {
                return (config.getFirestore ?? CustomFirestore.getConfig().getFirestore).FieldValue.arrayRemove(...params);
            } catch {}
        },
        writeBatch: (ref: any) => ref.batch(),
        onSnapshot: (ref: any, callback: any) => ref.onSnapshot(callback),
        ...config,
    };
};

export function arrayReplace(arrayUnion: any, arrayRemove: any) {
    return {arrayRemove, arrayUnion};
}

const arrayfy = (data: unknown) => (Array.isArray(data) ? data : [data]);

function matches(a: string, b: string) {
    return RegExp(`(.+) ${a}`).exec(b);
}

export function relid(collection: string, relationships: Array<string>) {
    for (const relationship of (Array.isArray(relationships) ? relationships : [])) {
        const match = matches(collection, relationship);

        if (match) {
            return match[1];
        }
    }
}

export function relids(collection: string, items: Array<string>) {
    return (Array.isArray(items) ? items : []).reduce((relids: Array<string>, relationship) => {
        const match = matches(collection, relationship);

        if (match) {
            relids.push(match[1]!);
        }

        return relids;
    }, []);
}

export function secure(params: {data: string, until?: number, placeholder?: string}) {
    return params.data.replace(RegExp(`\\w(?=.{${params.until ?? 0}})`, "g"), params.placeholder ?? "X");
}

export function getCollectionRelationship(collection: CustomFirestore, created?: boolean): string
export function getCollectionRelationship(collection: {id: string | number, name: string}): string
export function getCollectionRelationship(param1: CustomFirestore | {id: string | number, name: string}, param2 = false) {
    const isCustomFirestore = (param1 instanceof CustomFirestore);
    const id = isCustomFirestore ? (param2 ? param1.getData("id") : param1.getDoc().id) : param1.id;
    const name = isCustomFirestore ? param1.getCollectionName() : param1.name;

    return `${id} ${name}`;
}

/**
 * @deprecated.
 */
export function addCollection(target: Collection, options: CollectionOptions): Promise<any>
export function addCollection(target: Collection, owner: Collection, options?: CollectionOptions): Promise<any>
export function addCollection(param1: Collection, param2: Collection | CollectionOptions, param3?: CollectionOptions) {
    const {doc, batch, data: dataHandler = (data = {}) => data} = (param3 ?? param2) as CollectionOptions;

    return param1.create({
        doc,
        batch,
        data: (data) => dataHandler({
            ...data,
            ...(param2 && param3) ? {
                belongsTo: (owners: Array<string>) => {
                    return CustomFirestore.getConfig().arrayUnion(...owners.concat(getCollectionRelationship(param2 as Collection)));
                },
            } : {},
        }),
    });
}

/**
 * @deprecated.
 */
export const createUser = async <T extends Document, U extends CollectionOptions & {
    user?: Collection
}>(data: T, options: U) => {
    const {batch, user, creator, logging = false} = options;
    const {phone, phones, email, emails, address, addresses, company, companies, account, ...rest} = data;

    const _creator = creator?.getData("id") ? creator : Collection.proxy("users", {
        payload: {
            data: {
                value: {id: `${rest.id}`},
            },
        },
    });

    const _user = user ? (user.getCreator() ? user : user.setCreator(_creator)).replaceData({
        ...user.getData(),
        id: `${rest.id}`,
    }) : Collection.proxy("users", {
        payload: {
            data: {value: rest},
            logging,
        },
        creator: _creator,
    });

    const construct = (name: string, data: Record<string, any>, params: CollectionParams = {}) => {
        return Collection.proxy(name, {
            payload: {
                data: {value: data},
                logging,
            },
            parent: _user,
            creator: _creator,
            ...params,
        });
    };

    await Promise.all(
        [_user].reduce((operations: Array<Promise<unknown>>, user) => {
            if (phone || phones) {
                arrayfy(phone ?? phones).forEach((phone) => {
                    operations.push(
                        construct("phones", phone).create({batch}),
                    );
                });
            }

            if (email || emails) {
                arrayfy(email ?? emails).forEach((email) => {
                    operations.push(
                        construct("emails", email).create({batch}),
                    );
                });
            }

            if (address || addresses) {
                arrayfy(address ?? addresses).forEach((address) => {
                    operations.push(
                        construct("addresses", address).create({batch}),
                    );
                });
            }

            if (company || companies) {
                operations.push(
                    createUserCompany(data, options),
                );
            }

            operations.push(
                user.create({batch}),
            );

            return operations;
        }, []),
    );

    return _user;
};

/**
 * @deprecated.
 */
export const createUserCompany = async <T extends Document, U extends CollectionOptions & {
    user?: Collection
}>(data: T, options: U) => {
    const {batch, user, creator, logging = false} = options;
    const {company, companies, id} = data;

    const _creator = creator?.getData("id") ? creator : Collection.proxy("users", {
        payload: {
            data: {
                value: {id: `${id}`},
            },
        },
    });

    const _user = user ? (user.getCreator() ? user : user.setCreator(_creator)).replaceData({
        ...user.getData(),
        id: `${id}`,
    }) : Collection.proxy("users", {
        payload: {
            data: {
                value: {id: `${id}`},
            },
            logging,
        },
        creator: _creator,
    });

    const construct = (name: string, data: Record<string, any>, params: CollectionParams = {}) => {
        return Collection.proxy(name, {
            payload: {
                data: {value: data},
                logging,
            },
            parent: _user,
            creator: _creator,
            ...params,
        });
    };

    const r = await Collection.proxy("roles", {
        parent: _user,
    }).getDocuments({
        realtime: false,
        callback: (snapshot, collection) => {
            collection.replaceData(snapshot.docs.reduce((docs: Record<string, any>, doc) => {
                docs[doc.id] = doc.data();

                return docs;
            }, {}));
        },
    });

    return await Promise.all(
        arrayfy(company ?? companies).reduce((operations, company) => {
            const {account, setting, role, roles, id, ...rest} = company;

            {// create new scope for company constant
                const company = construct("companies", {
                    id: `${id ?? setting.id}`,
                    ...rest,
                });

                if (role || roles) {
                    arrayfy(role ?? roles).forEach((role) => {
                        const rr = (typeof role === "string") ? {id: role} : role;

                        operations.push(
                            construct("roles", {
                                ...rr,
                            }, {
                                owners: [company],
                            })[r.getData(rr.id) ? "update" : "create"]({
                                batch,
                                ...r.getData(rr.id) ? {
                                    data: {belongsTo: CustomFirestore.getConfig().arrayUnion(getCollectionRelationship(company))},
                                } : {},
                            }),
                        );
                    });
                }

                if (data.account || account) {
                    operations.push(
                        construct("accounts", data.account ?? account, {
                            parent: data.account ? _user : Collection.proxy("companies", {
                                payload: {
                                    data: company.getData(),
                                    logging,
                                },
                                creator: _creator,
                            }),
                            owners: [company],
                        }).create({batch}),
                    );
                }

                operations.push(
                    construct("settings", {
                        id: `${company.getDoc().id}`,
                        ...setting,
                    }, {
                        owners: [company],
                    }).create({batch}),
                );

                if (id) {
                    operations.push(
                        company.create({batch}),
                    );
                }

                return operations;
            }
        }, []),
    );
};

