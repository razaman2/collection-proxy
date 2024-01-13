# @razaman2/firestore-proxy

A custom firestore client that provides a simple and consistent interface for interacting with the database.

## Install the dependencies

```bash
npm install --save @razaman2/firestore-proxy
```

```bash
pnpm add @razaman2/firestore-proxy
```

<br/>
<br/>
<br/>

### ```THINGS YOU SHOULD KNOW```

#### All documents are created with the auto generated properties outlined by the following json object.

```json
{
    "belongsTo": [
        "document-id collection-name"
    ],
    "createdAt": "serverTimestamp",
    "updatedAt": "serverTimestamp",
    "id": "document-id"
}
```
1. The ```belongsTo``` is an array that stores all the document id's that have a relationship with the current 
   document. The convention is to list the document id followed by a space followed by the collection the document id is from. The relationship will always include the current document id.
> A settings document with id 111, that belongs to a user with id 222, and a company with id 333, would look like this
```{belongsTo: ["111 settings", "222 users", "333 companies"]}```. This relationship is intended to be queried using the ```array-contains``` or the ```array-contains-any``` operators.
This approach provides the ability to run queries like ```get all settings documents that belong to user with id 222``` or ```get all settings documents that belong to company with id 333``` or even ```get all settings documents that belong to user with id 222 and company 333```. The latter would require that when adding relationships, you concatenate the permutations you want to use for querying. ```{belongsTo: ["111 settings", "222 users", "333 companies", "222 users|333 companies]}``` now you can query a settings document that belongs to a specific user and company.
2. The ```createdAt``` key stores a firestore serverTimestamp that represents exactly when the document was created.
3. The ```updatedAt``` key stores a firestore serverTimestamp that represents the last time the document was updated. It will be automatically updated when the document is updated using the update method from the firestore-proxy.
4. The ```id``` key stores the assigned document id on the document data.

<br/>
<br/>

### Initializing the Collection

#### The firestore-proxy is compatible with both the ```namespaced``` and the ```modular``` firestore api's. The collection has a static configuration which allows you to configure the api once in the entry point of your app.

<i>be sure to initialize your firestore app!</i>

#### <ins>Namespaced API, including the Admin SDK</ins>
All you need to do to configure the namespaced api is to provide it with your firestore instance.

```javascript
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import {Collection} from "@razaman2/firestore-proxy";

firebase.initializeApp({projectId: "demo-app"});

Collection.proxy({
    getFirestore: firestore,
    // you can enable operation logging to console
    logging: true,
});

// And thats it!
```

#### <ins>Modular API</ins>
Import the functions from the firestore library and provide them to the collection config. You can provide only the functions that are needed for the operation you are trying to perform. 
```javascript
import {initializeApp} from "firebase/app";
import {getFirestore, collection, doc, getDoc, getDocs, collectionGroup, onSnapshot, setDoc, updateDoc, deleteDoc, deleteField, arrayUnion, serverTimestamp, writeBatch} from "firebase/firestore";
import {Collection} from "@razaman2/firestore-proxy";

initializeApp({projectId: "demo-app"});

Collection.proxy({
    // base setup to start working with the collection
    modular: true,
    getFirestore: getFirestore(),
    collection,
    doc,

    // when reading single document
    getDoc,

    // when reading multiple documents
    getDocs,

    // when reading from a collection group
    collectionGroup,

    // when reading documents using a snapshot
    onSnapshot,

    // when creating, updating or deleting documents
    setDoc,

    // when updating documents
    updateDoc,

    // when deleting documents
    deleteDoc,
   
    // when you want to delete undefined document fields
    deleteField,

    // when creating documents
    arrayUnion,

    // when creating or updating documents
    serverTimestamp,

    // when updating documents
    writeBatch,

    // you can enable operation logging to console
    logging: true,
});
```

#### <ins>Reading Documents</ins>

```javascript
// init with document id
const collection = await Collection.proxy("users").init(1);

const data = collection.getData();
```

```javascript
// get document for provided id
const collection = await Collection.proxy("users").getDocument(1, {realtime: false});

const data = collection.getData();
```

```javascript
// set
const collection = await Collection.proxy("users").setDoc(1).init();
```

#### <ins>Creating Documents</ins>

```javascript
// create document with auto-generated id
await Collection.proxy("tests").create({
    data: {name: "john doe"},
});
```

```javascript
// create document with id from setDoc
await Collection.proxy("tests").setDoc("123").create({
    data: {name: "john doe"},
});
```

```javascript
// create document with id from payload data
await Collection.proxy("tests", {
    payload: {
        data: {id: "123", name: "john doe"},
    },
}).create();
```

```javascript
// create document with id from document path
await Collection.proxy().setPath("tests/123").create({
    data: {name: "john doe"},
});
```

```javascript
// create document with setPath and setDoc
await Collection.proxy().setPath("tests").setDoc("123").create({
    data: {name: "john doe"},
});
```

#### <ins>Updating Documents</ins>

```javascript
// update document with auto-generated id
await Collection.proxy("tests").update({
    data: {name: "jane doe"},
});
```

```javascript
// update document with id from setDoc
await Collection.proxy("tests").setDoc("123").update({
    data: {name: "jane doe"},
});
```

```javascript
// update document with id from payload data
await Collection.proxy("tests", {
    payload: {
        data: {id: "123", name: "jane doe"},
    },
}).update();
```

```javascript
// update document with id from document path
await Collection.proxy().setPath("tests/123").update({
    data: {name: "jane doe"},
});
```

```javascript
// update document with setPath and setDoc
await Collection.proxy().setPath("tests").setDoc("123").update({
    data: {name: "jane doe"},
});
```

#### <ins>Deleting Documents</ins>

```javascript
// delete document with id from setDoc
await Collection.proxy("tests").setDoc("123").delete();
```

```javascript
// delete document with id from payload data
await Collection.proxy("tests", {
    payload: {
        data: {id: "123"},
    },
}).delete();
```

```javascript
// delete document with id from document path
await Collection.proxy().setPath("tests/123").delete();
```

```javascript
// delete document with setPath and setDoc
await Collection.proxy().setPath("tests").setDoc("123").delete();
```

#### <ins>Audit trail</ins>
<i>you can attach built in **audit trail** to ```create```, ```update``` and ```delete``` operations</i>
```javascript
import {Update} from "@razaman2/firestore-proxy";

// audit trail any create, update or delete operations on the proxy
Collection.proxy("tests").onWrite({
   handler: (collection) => new Update(collection),
   triggers: ["create", "update", "delete"], // when you perform an operation listed in the triggers array, an associated update will be created to reflect the before and after state of the document.
});

// attach audit trail when creating a document
Collection.proxy("tests").create({
   data: {id: "123", name: "john doe"},
   update: (collection) => new Update(collection),
});

// attach audit trail when updating a document
Collection.proxy("tests").update({
   data: {id: "123", name: "jane doe"},
   update: (collection) => new Update(collection),
});

// attach audit trail when deleting a document
Collection.proxy("tests").delete({
   data: {id: "123", name: "jane doe"},
   update: (collection) => new Update(collection),
});
```





