import {ResolveConfig} from "./index";
import {CollectionReference, DocumentReference, DocumentSnapshot, Query, QuerySnapshot, Unsubscribe} from "firebase/firestore";
import ObjectManager from "@razaman2/object-manager";
import DataManager from "@razaman2/data-manager";
import Collection from "./Collection";
import Updates from "./Updates";
import type {DataClient} from "@razaman2/data-manager";
import type CollectionInterface from "./interfaces/CollectionInterface";
import type FirestoreConfig from "./interfaces/FirestoreConfig";
import type {CollectionQueryOptions, ReadReturnType, DocumentQueryOptions, ReadCallback, UpdateHandler, WriteTypes, WriteModes} from "./Types";
import {name, version} from "../package.json";

export default class CustomFirestore extends DataManager {
    protected doc: DocumentReference;
    protected collection = "tests";
    protected updates?: {triggers: Array<WriteTypes>, handler: UpdateHandler};
    protected static config1: Partial<FirestoreConfig>;
    protected static config2: Partial<FirestoreConfig>;

    protected static initialize(config: Partial<FirestoreConfig>) {
        if (CustomFirestore.config1) {
            CustomFirestore.config2 = config;
        } else {
            CustomFirestore.config1 = config;
        }
    }

    public constructor(client: DataClient, config?: Partial<FirestoreConfig>) {
        super(Object.assign(client, {
            logging: (typeof client?.logging === "boolean")
                ? client.logging
                : config?.logging,
        }));

        this.setCollectionName(client.collection ?? this.getCollectionName());

        CustomFirestore.initialize(ResolveConfig(config ?? {}));

        const id1 = this.getData("id", "").toString().trim();
        const id2 = CustomFirestore.getConfig().doc(this.getCollection()).id;

        this.doc = this.getDocRef(id1.length ? id1 : id2);

        this.build[name] = version;
    }

    public getFirestore() {
        const firestore = CustomFirestore.getConfig().getFirestore;

        return (typeof firestore === "function") ? firestore() : firestore;
    }

    protected isShouldUpdate(data: Record<string, any>) {
        const id = this.getData("id", "");

        return Boolean(
            ((typeof id === "string") || (typeof id === "number"))
            && id.toString().trim().length
            && data
            && !data.hasOwnProperty("id"),
        );
    }

    public init(): Promise<this>
    public init(id: string | number): Promise<this>
    public init(callback: ReadCallback<DocumentSnapshot, this>): Promise<this>
    public init(id: string | number, callback: ReadCallback<DocumentSnapshot, this>): Promise<this>
    public init(param1?: string | number | ReadCallback<DocumentSnapshot, this>, param2?: ReadCallback<DocumentSnapshot, this>) {
        const callback = (typeof param1 === "function")
            ? param1
            : param2;

        const id = /string|number/.test(typeof param1)
            ? param1
            : this.getData("id");

        return new Promise(async (resolve, reject) => {
            try {
                await this.getDocument(id, {realtime: false, callback});

                resolve(this);
            } catch (e) {
                reject(e);
            }
        });
    }

    public getDocument(): Unsubscribe
    public getDocument(id: string | number): Unsubscribe
    public getDocument(id: string | number, callback: ReadCallback<DocumentSnapshot, this>): Unsubscribe
    public getDocument(callback: ReadCallback<DocumentSnapshot, this>): Unsubscribe
    public getDocument<T extends Partial<DocumentQueryOptions<this>>>(options: T): ReadReturnType<T, this>
    public getDocument<T extends string | number, U extends Partial<DocumentQueryOptions<this>>>(id: string | number, options: U): ReadReturnType<U, this>
    public getDocument(param1?: string | number | ReadCallback<DocumentSnapshot, this> | Partial<DocumentQueryOptions<this>>, param2?: ReadCallback<DocumentSnapshot, this> | Partial<DocumentQueryOptions<this>>) {
        const handler: ReadCallback<DocumentSnapshot, this> = (snapshot, collection) => {
            return collection.replaceData(snapshot.data({serverTimestamps: "estimate"}) ?? {});
        };

        const callback = ((typeof param1 === "function")
            ? param1
            : (typeof param1 === "object")
                ? (param1.callback ?? handler)
                : (typeof param2 === "function")
                    ? param2
                    : (typeof param2 === "object")
                        ? (param2.callback ?? handler)
                        : handler) as ReadCallback<DocumentSnapshot, this>;

        const realtime = ((typeof param1 === "object")
            ? (param1.realtime ?? true)
            : (typeof param2 === "object")
                ? (param2.realtime ?? true)
                : true);

        const id = ((typeof param1 === "string") || (typeof param1 === "number")) ? param1 : "";
        const ref = this.resolveDoc({doc: this.getDoc(id)});

        return realtime
            ? CustomFirestore.getConfig().onSnapshot(ref, (snapshot: DocumentSnapshot) => {
                return callback(snapshot, this);
            })
            : new Promise(async (resolve, reject) => {
                try {
                    const snapshot = await CustomFirestore.getConfig().getDoc(ref);

                    await callback(snapshot, this);

                    resolve(this);
                } catch (e) {
                    reject(e);
                }
            });
    }

    public getDocuments(): Unsubscribe
    public getDocuments(callback: ReadCallback<QuerySnapshot, this>): Unsubscribe
    public getDocuments<U extends Partial<CollectionQueryOptions<this>>>(options: U): ReadReturnType<U, this>
    public getDocuments(param1?: ReadCallback<QuerySnapshot, this> | Partial<CollectionQueryOptions<this>>) {
        const handler = (snapshot: QuerySnapshot, collection: this) => {
            return collection.replaceData(snapshot.docs.map((doc) => {
                return doc.data({serverTimestamps: "estimate"});
            }));
        };

        const {
            group = false,
            realtime = true,
            query = (ref: Query) => ref,
            callback = handler,
        } = (typeof param1 === "object") ? param1 : {callback: (typeof param1 === "function") ? param1 : handler};

        const ref = group ? this.getCollectionGroup() : this.getCollection();

        return realtime
            ? CustomFirestore.getConfig().onSnapshot(query(ref), (snapshot: QuerySnapshot) => {
                return callback(snapshot, this);
            })
            : new Promise(async (resolve, reject) => {
                try {
                    const snapshot = await CustomFirestore.getConfig().getDocs(query(ref));

                    await callback(snapshot, this);

                    resolve(this);
                } catch (e) {
                    reject(e);
                }
            });
    }

    public getPayload(params: CollectionInterface = {}): Record<string, any> {
        const {id, ...data} = this.resolveData(params.data);

        return {
            ...data,
            id: this.resolveDoc({doc: id ? this.getDoc(id) : params.doc}).id,
            createdAt: this.getTimestamp(data.createdAt, data),
            updatedAt: this.getTimestamp(data.updatedAt, data),
        };
    }

    public async create(params: CollectionInterface = {}) {
        const {
            batch,
            update,
            transform,
            merge = false,
        } = params;

        const payload = this.getPayload({
            ...params,
            data: (transform ?? this.transform)(this.resolveData(params.data), "create"),
        });

        const object = ObjectManager.on(payload, {
            undefined: CustomFirestore.getConfig().deleteField(),
        }).set(payload);

        {
            const payload = object.get();

            await this.config?.notifications?.emit("creating", this, params, payload);

            if (this.config?.logging) {
                console.log(`%cSet ${this.config.name ?? this.constructor.name} Data:`, `color: green;`, {
                    storage: this,
                    payload,
                    params,
                });
            }

            const doc = params.doc
                ? this.resolveDoc(params)
                : this.getDoc(payload.id);

            await this.audittrail(update!, {batch, data: payload}, "create");

            return batch
                ? batch.set(doc, payload, {merge})
                : CustomFirestore.getConfig().setDoc(doc, payload, {merge});
        }
    }

    public async update(params: CollectionInterface = {}) {
        const {
            batch,
            update,
            transform,
            data = {},
            merge = true,
        } = params;

        const {id, ...payload} = Object.assign((transform ?? this.transform)(this.resolveData(data), "update"), {
            updatedAt: this.getTimestamp(),
        });

        const object = ObjectManager.on(payload, {
            undefined: CustomFirestore.getConfig().deleteField(),
        }).set(payload);

        {
            const payload = object.get();

            await Promise.all(object.paths().map((path) => {
                return this.config?.notifications?.emit(`globalWrite.${path}`, object.get(path), params, payload);
            }).concat(this.config?.notifications?.emit("globalWrite", payload, params)));

            await this.config?.notifications?.emit("updating", this, params, payload);

            if (this.config?.logging) {
                console.log(`%cSet ${this.config.name ?? this.constructor.name} Data:`, `color: cyan;`, {
                    storage: this,
                    payload,
                    params,
                });
            }

            const doc = params.doc
                ? this.resolveDoc(params)
                : this.getDoc(id);

            const exec = async (batch: any) => {
                return merge ? batch.set(doc, payload, {merge}) : batch.update(doc, payload);
            };

            await this.audittrail(update!, {batch, data: payload}, "update");

            return batch
                ? exec(batch)
                : exec({set: CustomFirestore.getConfig().setDoc, update: CustomFirestore.getConfig().updateDoc});
        }
    }

    public async delete(params: CollectionInterface = {}) {
        const {
            batch,
            update,
            data,
        } = params;

        const payload = this.resolveData(data);

        await this.config?.notifications?.emit("deleting", this, params);

        if (this.config?.logging) {
            console.log(`%cSet ${this.config.name ?? this.constructor.name} Data:`, `color: red;`, {
                storage: this,
                params,
                payload,
            });
        }

        const doc = params.doc
            ? this.resolveDoc(params)
            : this.getDoc(payload.id);

        await this.audittrail(update!, {batch}, "delete");

        return batch
            ? batch.delete(doc)
            : CustomFirestore.getConfig().deleteDoc(doc);
    }

    /**
     * @deprecated Use delete instead.
     */
    public remove(params: CollectionInterface = {}) {
        return this.delete(params);
    }

    public setData(value: any): this
    public setData(path: string | number | boolean, value: any): this
    public setData(value: any, mode?: WriteModes): this
    public setData(path: string | number | boolean, value: any, mode?: WriteModes): this
    public setData(...params: Array<any>) {
        const object = (typeof params[0] === "object");
        const mode = {1: "lazy", 2: (object ? params[2] : "lazy"), 3: params[2]}[arguments.length];
        const data1 = (object ? params.slice(0, 1) : params);

        const data2 = object
            ? params[0]
            : new DataManager({data: {}}).setIgnoredPath(this.ignored).setData(...data1 as [any]).getData();

        if (this.isShouldUpdate(data2) && /lazy|eager/.test(mode)) {
            this.globalWrite(data2, mode);
        } else {
            super.setData(data1[0].__config ? params[0] : data2);
        }

        return this;
    }

    public getTimestamp(date?: any, data?: Record<string, any>) {
        try {
            if (/Date|Timestamp/.test(date.constructor.name)) {
                return date;
            } else {
                return date(data);
            }
        } catch {
            return CustomFirestore.getConfig().serverTimestamp();
        }
    }

    public getCollection(): CollectionReference {
        return CustomFirestore.getConfig().collection(this.getFirestore(), this.getCollectionName());
    }

    public getCollectionGroup(): CollectionReference | Query {
        return CustomFirestore.getConfig().collectionGroup(this.getFirestore(), this.getCollectionName());
    }

    public getDoc(id?: string | number): DocumentReference
    public getDoc(param1?: string | number) {
        const id = this.getData(param1 ?? "id", param1 ?? "").toString();
        const isValidId = (id: string | number) => Boolean((typeof id === "string") && id.trim().length);

        if ((isValidId(id) && isValidId(this.doc.id)) && (id === this.doc.id)) {
            return this.getDocRef(this.doc.id);
        } else if (isValidId(id)) {
            return this.getDocRef(id);
        } else {
            return this.getDocRef(this.doc.id);
        }
    }

    public setDoc(): this
    public setDoc(id: string | number): this
    public setDoc(doc: DocumentReference): this
    public setDoc(param1?: string | number | DocumentReference) {
        this.resolveDoc({
            doc: ((typeof param1 === "string") || (typeof param1 === "number"))
                ? this.getDoc(param1)
                : param1 ?? CustomFirestore.getConfig().doc(this.getCollection()),
        });

        return this;
    }

    protected getDocRef(id: string) {
        return CustomFirestore.getConfig().doc(this.getFirestore(), this.getCollection().path, id);
    }

    public getCollectionName() {
        return this.collection;
    }

    public setCollectionName(name: string) {
        this.collection = name;

        return this;
    }

    protected async globalWrite(data: Record<string, any>, mode: WriteModes) {
        const batch = CustomFirestore.getConfig().writeBatch(this.getFirestore());
        const params = {data, batch};

        await this.update(params);
        await batch.commit();
        await this.config?.notifications?.emit("updated", this, params, data);

        if (mode === "eager") {
            super.setData(data);
        }
    }

    protected transform(data: {[key: string]: any}, operation: WriteTypes) {
        return data;
    }

    protected resolveDoc(params: CollectionInterface = {}) {
        const {doc} = params;

        return this.doc = ((typeof doc === "function") ? doc(this.getCollection()) : doc) ?? this.getDoc();
    }

    protected resolveData<T extends Record<string, any>>(data?: T | ((data?: T) => T)) {
        return ((typeof data === "function") ? data(this.getData()) : data) ?? this.getData();
    }

    protected audittrail(update: UpdateHandler, params: CollectionInterface, type: WriteTypes) {
        if (update !== false) {
            if (update) {
                return (((typeof update === "function")
                        ? update(this as unknown as Collection)
                        : update
                ) as Updates).record(params, type);
            } else if (this.updates?.triggers.includes(type)) {
                return (((typeof this.updates?.handler === "function")
                        ? this.updates.handler(this as unknown as Collection)
                        : this.updates.handler
                ) as Updates).record(params, type);
            }
        }
    }

    public onWrite(options: {handler: UpdateHandler, triggers: Array<WriteTypes>}) {
        this.updates = options;

        return this;
    }

    public static getConfig() {
        return new Proxy(CustomFirestore.config2 ?? {}, {
            get(target, key) {
                if (target.hasOwnProperty(key)) {
                    return target[key];
                } else {
                    return CustomFirestore.config1?.[key];
                }
            },
        });
    }
}
