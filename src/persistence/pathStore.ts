import {keyToPath} from "./pathUtil.ts";
import {MIMETYPE_OCTET_STREAM, MIMETYPE_PLAIN_TEXT} from "./mimeTypes.ts";
import {createNonGlobalRegex, escapeRegexCharacters} from "@/common/regExUtil";

/*
  # What Is This Module?

  It's a persistent storage utility. You can use it to do key/value retrieval and storage via IndexedDb. It's vendored in to the project 
  with no dependencies so you can easily revise. I aim to provide you code you can understand and maintain on your own rather 
  than add a "black box" dependency to your project. Nothing I'm doing in this module is very complicated.

  Beyond simple key/value retrieval, there are a few other features:
  * Assumption of every key containing something that could be stored as a file. (Useful for import/export functionality, e.g., downloading a backup as a zip file)
  * Some simple querying and filtering to do things like retrieve multiple keys matching criteria or find data that has changed after a certain date.
  * Data upgrade logic so you can change the format of your data over time without impacting users.

  # How To Do Data Upgrades
  
  As you release diffent versions of your web app to production, it's important to understand that some users can have old versions 
  of data that need to be upgraded. 
  
  The IndexedDb schema has a SCHEMA_VERSION, which is different than the APP_DATA_VERSION. The 
  SCHEMA_VERSION should only change if you decide to go beyond the key/value storage mechanism of this module or there is some update from
  the template affecting the schema. (In the latter case, that update should have a migration solution available in newer template code.) 
  
  The APP_DATA_VERSION, on the other hand, should increment each time you release a new
  version of your web app to production that relies on a different app-defined format of data stored in the key/value store. 
  And in this case, you should write corresponding handlers inside of `_upgradeRecord()` to upgrade data where needed.

  The approach taken here is to lazy-upgrade records one at a time, as they are requested. If you have records that need to be updated together
  in an atomic way, you can write a custom upgrade function. (Such a function might start a transaction,
  call _upgradeRecord() in a certain dependency order on records that need this, and complete the transaction atomically.)
  
  But otherwise, the lazy-upgrade approach has the advantage of doing the upgrade work in small amounts of time unlikely to block the UI.
  Since each request for a record checks for and performs an upgrade as needed in a transaction, we should also avoid any race conditions. The 
  only thing it might miss is, as previously mentioned, cases where Record A and Record B must be upgraded together at the same time using 
  information that isn't self-contained in each record. If you write upgrade handlers for records, you'll notice any places where an upgrade to 
  one record seems to need upgrades to be performed with data from other records. So just write your upgrade handlers, and it should
  become clear if something more than lazy-upgrade is needed for your app.

  In general, if you follow a [denormalized](https://www.techtarget.com/searchdatamanagement/definition/denormalization) approach for 
  designing data structures when using this module, lazy upgrades will likely work and your upgrade handlers shouldn't be hard to write.

  # Design Suggestions

  Here is what I like to do: (You can do different.)

  * Create a new module under /src/persistence for each kind of data I want to work with, e.g., invoices.ts, and lightly wrap `get*()` and `put*()` APIs
    in the new module with use-case specific APIs, like `createNewInvoice(customerName, date)`.
  * Use custom types for data (e.g. `type Invoice { customerName:string, date:Date }`) and use `JSON.parse()/stringify()` for (de)serialization in 
    conjuction with calls to `getText()/setText()`
  * Use denormalized design of data structures.
  * Treat persistent storage as a replacement for in-memory stores like Redux. Most React apps really only need a central store for passing data 
    between screens/routes. State management inside of one screen can be easily handled with React components and `useState`. If you are persisting 
    user data already for its other advantages, it will usually be instant-fast for screen transitions. So if I'm writing persistent storage code, 
    I probably have no need to also write code to update an in-memory store.

*/

const SCHEMA_VERSION = 1; // Only incremented if IndexedDb schema changes, which is decoupled from app data version.
const APP_DATA_VERSION = 1; // Increment each time a production release is made where the format of values stored in KeyValueRecord changed.
const DB_NAME = `Hone-${SCHEMA_VERSION}`;
const KEY_VALUE_STORE = 'KeyValue';
const PATH_INDEX_NAME = 'pathIndex';

type IndexConfig = {
  name:string,
  keypath:string,
  options:IDBIndexParameters
}

const SCHEMA = {
  __version:SCHEMA_VERSION,
  [KEY_VALUE_STORE]: {
    __options:{keyPath:'key'},
    __indexes:[{name:PATH_INDEX_NAME, keypath:'path', options:{unique:false, multiEntry:false}}]
  }
};

export type KeyValueRecord = {
  key:string,
  path:string,
  appDataVersion:number,
  mimeType:string,
  lastModified:number,
  text:string|null,
  bytes:Uint8Array|null
};

//
// Helper functions
//

function _getStoreNamesFromSchema(schema:any):string[] {
  return Object.keys(schema).filter(key => key !== '__version');
}

function _createStores(db:IDBDatabase, schema:any) {
  const storeNames = _getStoreNamesFromSchema(schema);
  storeNames.forEach(storeName => {
    const storeSchema = schema[storeName];
    const store = db.createObjectStore(storeName, storeSchema.__options);
    const indexes:IndexConfig[] = storeSchema.__indexes ?? [];
    indexes.forEach(indexConfig => {
      store.createIndex(indexConfig.name, indexConfig.keypath, indexConfig.options);
    });
  });
}

async function _open(name:string, schema:any):Promise<IDBDatabase> {
  const version = schema.__version;
  let wereStoresCreated = false;
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onerror = (event:any) => reject(`Failed to open "${name}" database with error code ${event.target.errorCode}.`);
    request.onupgradeneeded = (event:any) => {
      const db = event.target.result as IDBDatabase;
      if (schema.__version === 1) { _createStores(db, schema); } else { throw new Error('Schema migration is unimplemented.'); } // In this case, probably old code is running against a newer schema. Check for updates in the template to copy over.
      wereStoresCreated = true;
    }
    request.onsuccess = (event:any) => {
      const db = event.target.result as IDBDatabase;
      db.onerror = (event:any) => { throw Error("Database error: " + event.target.errorCode); } // Not using reject() since error could come later after this promise completes.
      if (wereStoresCreated) _populateStores(db, schema);
      resolve(db);
    }
  });
}

async function _get(db:IDBDatabase, storeName:string, key:string):Promise<object> {
  const transaction = db.transaction(storeName);
  const objectStore = transaction.objectStore(storeName);
  const request = objectStore.get(key);
  return new Promise((resolve, reject) => {
    transaction.onerror = (event:any) => reject(`Failed to get from "${storeName} with error code ${event.target.errorCode}.`);
    transaction.oncomplete = (_event:any) => resolve(request.result)
  });
}

async function _put(db:IDBDatabase, storeName:string, objectToStore:object):Promise<void> {
  const transaction = db.transaction(storeName, 'readwrite');
  const objectStore = transaction.objectStore(storeName);
  objectStore.put(objectToStore);
  return new Promise((resolve, reject) => {
    transaction.onerror = (event:any) => reject(`Failed to put to "${storeName} with error code ${event.target.errorCode}.`);
    transaction.oncomplete = () => resolve();
  });
  
}

async function _delete(db:IDBDatabase, storeName:string, key:string):Promise<void> {
  const transaction = db.transaction(storeName, 'readwrite');
  const objectStore = transaction.objectStore(storeName);
  objectStore.delete(key);
  return new Promise((resolve, reject) => {
    transaction.onerror = (event:any) => reject(`Failed to delete record at "${key}" in "${storeName} with error code ${event.target.errorCode}.`);
    transaction.oncomplete = () => resolve();
  });
}

export async function deleteDatabase():Promise<void> {
  const request = indexedDB.deleteDatabase(DB_NAME);
  return new Promise((resolve, reject) => {
    request.onerror = (event:any) => reject(`Failed to delete "${DB_NAME}}" database with error code ${event.target.errorCode}.`);
    request.onsuccess = () => resolve();
  });
}

async function _getRecordByKey(key:string):Promise<KeyValueRecord> {
  const db = await _open(DB_NAME, SCHEMA);
  const record = await _get(db, KEY_VALUE_STORE, key) as KeyValueRecord;
  if (record === undefined || record.appDataVersion === APP_DATA_VERSION) return record;
  if (record.appDataVersion > APP_DATA_VERSION) throw new Error(`Record at ${key} is v${record.appDataVersion} while app only knows versions up to v${APP_DATA_VERSION}.`); // TODO - need to surface this to UI to trigger a reload, and also handle the case where reloading doesn't fix it.
  _upgradeRecord(record);
  _put(db, KEY_VALUE_STORE, record);
  return record;
}

async function _setFieldValue(key:string, fieldName:string, fieldValue:any, mimeType:string) {
  const db = await _open(DB_NAME, SCHEMA);
  const record = await _getRecordByKey(key)
    ?? { key } as KeyValueRecord;
  (record as any)[fieldName] = fieldValue;
  record.appDataVersion = APP_DATA_VERSION;
  record.path = keyToPath(key);
  record.mimeType = mimeType;
  record.lastModified = Date.now();
  await _put(db, KEY_VALUE_STORE, record);
}

function _changePathOfKey(key:string, path:string, nextPath:string):string {
  return nextPath + key.slice(path.length);
}

async function _replaceRecordUsingNewKey(db:IDBDatabase, key:string, nextKey:string, updateLastModified:boolean) {
  const record:KeyValueRecord|null = await _get(db, KEY_VALUE_STORE, key) as KeyValueRecord|null;
  if (!record) throw Error(`Did not find existing record matching "${key}" key.`);
  record.key = nextKey;
  record.path = keyToPath(nextKey);
  if (updateLastModified) record.lastModified = Date.now();
  await _put(db, KEY_VALUE_STORE, record);
  await _delete(db, KEY_VALUE_STORE, key);
}

async function _renamePath(db:IDBDatabase, currentPath:string, nextPath:string) {
  const currentPathEscaped = escapeRegexCharacters(currentPath);
  const regExp:RegExp = new RegExp(`${currentPathEscaped}.*`, '');
  const descendentKeys:string[] = await getAllKeysMatchingRegex(regExp);

  const promises:Promise<void>[] = [];
  for(let keyI = 0; keyI < descendentKeys.length; ++keyI) {
    const descendentKey:string = descendentKeys[keyI];
    const descendentNextKey = _changePathOfKey(descendentKey, currentPath, nextPath);
    promises.push(_replaceRecordUsingNewKey(db, descendentKey, descendentNextKey, false));
  }
  await Promise.all(promises);
}

//
// Modification points
//

function _populateStores(_db:IDBDatabase, _schema:any) {
  // For adding any initial data to empty stores after they've just been created.
}

// This function will be called any time that _getRecordByKey() is called and the record retrieved has a lower appDataVersion than APP_DATA_VERSION.
// You have to write a handler for each kind of record that has a change in format. If you never increment APP_DATA_VERSION, then you never
// need to write these handlers.
function _upgradeRecord(record:KeyValueRecord) {

  /* 
  // Example handlers - JSON for a street address was updated from v1 to v2 to include a new "country" field. 
  // And from v2 to v3, the "state" and "zipCode" fields were renamed to "stateOrProvince" and "postalCode".

  // v1 -> v2 upgrades
  if (record.appDataVersion === 1) {
    if (record.path === 'userAddress' && record.text) { 
      let object:any = JSON.parse(record.text);
      object.countryCode = 'US';
      record.appDataVersion = 2;
    } else { // In this fictitious case, we know that all other types of records had no format change.
      record.appDataVersion = 2;
    }
  }

  // v2 -> v3 upgrades (cascades from above handler to cover v1 -> v3)
  if (record.appDataVersion == 2) {
    if (record.path === 'userAddress' && record.text) {
      let object:any = JSON.parse(record.text);
      object.stateOrProvince = object.state;
      object.postalCode = object.zipCode;
      delete object.state;
      delete object.zipCode;
      record.text = JSON.stringify(object);
      record.appDataVersion = 3;
    } else {
      record.appDataVersion = 3;
    }
  } */
  
  if (record.appDataVersion !== APP_DATA_VERSION) throw new Error(`Record at ${record.key} did not have upgrade handling.`);
  return record;
}

//
// API
//

export async function getText(key:string):Promise<string|null> {
  const record = await _getRecordByKey(key);
  return record?.text ?? null;
}

// `since` is a seconds-since-1970 timestamp. If you have a Date object, you can use date.getTime() to get this value.
export async function getTextIfModified(key:string, since:number):Promise<string|null> {
  const record = await _getRecordByKey(key);
  return (record && record.text !== null && record.lastModified > since) ? record.text : null;
}

export async function getBytes(key:string):Promise<Uint8Array|null> {
  const record = await _getRecordByKey(key);
  return record?.bytes ?? null;
}

// `since` is a seconds-since-1970 timestamp. If you have a Date object, you can use date.getTime() to get this value.
export async function getBytesIfModified(key:string, since:number):Promise<Uint8Array|null> {
  const record = await _getRecordByKey(key);
  return (record && record.bytes !== null && record.lastModified > since) ? record.bytes : null;
}

export async function setText(key:string, text:string|null, mimeType:string = MIMETYPE_PLAIN_TEXT) {
  await _setFieldValue(key, 'text', text, mimeType);
}

export async function setBytes(key:string, bytes:Uint8Array|null, mimeType = MIMETYPE_OCTET_STREAM) {
  await _setFieldValue(key, 'bytes', bytes, mimeType);
}

export async function doesDatabaseExist():Promise<boolean> {
  const dbInfos:IDBDatabaseInfo[] = await indexedDB.databases();
  const found = dbInfos.find(dbInfo => dbInfo.name === DB_NAME);
  return found !== undefined;
}

export async function getAllKeys():Promise<string[]> {
  const db = await _open(DB_NAME, SCHEMA);
  const transaction = db.transaction(KEY_VALUE_STORE);
  const objectStore = transaction.objectStore(KEY_VALUE_STORE);
  const request = objectStore.getAllKeys();
  return new Promise((resolve, reject) => {
    request.onerror = (event:any) => reject(`Failed to get all keys with error code ${event.target.errorCode}.`);
    request.onsuccess = () => resolve(request.result as string[])
  });
}

export async function getAllKeysAtPath(path:string):Promise<string[]> {
  const db = await _open(DB_NAME, SCHEMA);
  const transaction = db.transaction(KEY_VALUE_STORE);
  const objectStore = transaction.objectStore(KEY_VALUE_STORE);
  const pathIndex = objectStore.index(PATH_INDEX_NAME);
  const request = pathIndex.getAllKeys(path);
  return new Promise((resolve, reject) => {
    request.onerror = (event:any) => reject(`Failed to get all keys from "${path}" path with error code ${event.target.errorCode}.`);
    request.onsuccess = () => resolve(request.result as string[]);
  });
}

export async function getAllKeysMatchingRegex(regex:RegExp):Promise<string[]> {
  const db = await _open(DB_NAME, SCHEMA);
  const transaction = db.transaction(KEY_VALUE_STORE);
  const objectStore = transaction.objectStore(KEY_VALUE_STORE);
  const request = objectStore.getAllKeys();
  regex = createNonGlobalRegex(regex);
  return new Promise((resolve, reject) => {
    request.onerror = (event:any) => reject(`Failed to get all keys with error code ${event.target.errorCode}.`);
    request.onsuccess = () => {
      const keys:string[] = request.result as string[];
      const filteredKeys = keys.filter(key => regex.test(key));
      resolve(filteredKeys);
    }
  });
}

export async function getAllValuesAtPath(path:string):Promise<KeyValueRecord[]> {
  const db = await _open(DB_NAME, SCHEMA);
  const transaction = db.transaction(KEY_VALUE_STORE);
  const objectStore = transaction.objectStore(KEY_VALUE_STORE);
  const pathIndex = objectStore.index(PATH_INDEX_NAME);
  const request = pathIndex.getAll(path);
  return new Promise((resolve, reject) => {
    request.onerror = (event:any) => reject(`Failed to get all values from "${path}" path with error code ${event.target.errorCode}.`);
    request.onsuccess = () => resolve(request.result as KeyValueRecord[]);
  });
}

export async function getValuesForKeys(keys:string[]):Promise<KeyValueRecord[]> {
  const db = await _open(DB_NAME, SCHEMA);
  const transaction = db.transaction(KEY_VALUE_STORE);
  const objectStore = transaction.objectStore(KEY_VALUE_STORE);
  
  function _getValueByKey(key:string):Promise<KeyValueRecord> {
    const request = objectStore.get(key);
    return new Promise((resolve, reject) => {
      request.onerror = (event:any) => reject(`Failed to get ${key} from "${KEY_VALUE_STORE} with error code ${event.target.errorCode}.`);
      request.onsuccess = (_event:any) => resolve(request.result)
    });
  }

  const promises = keys.map(_key => _getValueByKey(_key));
  return Promise.all(promises);
}

export async function renamePath(currentPath:string, nextPath:string):Promise<void> {
  const db = await _open(DB_NAME, SCHEMA);
  return _renamePath(db, currentPath, nextPath);
}

export async function renameKey(currentKey:string, nextKey:string):Promise<void> {
  const db = await _open(DB_NAME, SCHEMA);
  await _replaceRecordUsingNewKey(db, currentKey, nextKey, true);
  const currentDescendantPath = `${currentKey}/`;
  const nextDescendantPath = `${nextKey}/`;
  return await _renamePath(db, currentDescendantPath, nextDescendantPath);
}

export async function deleteByKey(key:string):Promise<void> {
  const db = await _open(DB_NAME, SCHEMA);
  await _delete(db, KEY_VALUE_STORE, key);
}

export async function deleteAllKeys(keys:string[]):Promise<void> {
  const db = await _open(DB_NAME, SCHEMA);
  const transaction = db.transaction(KEY_VALUE_STORE, 'readwrite');
  const objectStore = transaction.objectStore(KEY_VALUE_STORE);
  keys.forEach(key => objectStore.delete(key));
  return new Promise((resolve, reject) => {
    transaction.onerror = (event:any) => reject(`Failed to delete records with error code ${event.target.errorCode}.`);
    transaction.oncomplete = () => resolve();
  });
}

export async function deleteAllKeysAtPathExcept(path:string, exceptKeys:string[]) {
  const keys = await getAllKeysAtPath(path);
  const keysToDelete = keys.filter(key => !exceptKeys.includes(key));
  if (!keysToDelete.length) return;
  await deleteAllKeys(keysToDelete);
}

export async function deleteAllKeysAtPath(path:string):Promise<void> {
  const keys = await getAllKeysAtPath(path);
  if (!keys.length) return;
  await deleteAllKeys(keys);
}

export async function doesKeyExist(key:string):Promise<boolean> {
  const db = await _open(DB_NAME, SCHEMA);
  const transaction = db.transaction(KEY_VALUE_STORE, 'readonly');
  const cursorRequest = transaction.objectStore(KEY_VALUE_STORE).openCursor(key);
  return new Promise((resolve, reject) => {
    cursorRequest.onerror = (event:any) => reject(`Failed to check if key "${key}" exists with error code ${event.target.errorCode}.`);
    cursorRequest.onsuccess = (event:any) => {
      const cursor = event.target.result;
      resolve(cursor !== null);
    }
  });
}