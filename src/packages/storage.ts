import { getLogger } from "..";

let log = getLogger(__filename)


// Stroage service abstraction

export abstract class StorageService {

    constructor() {}
    abstract setItem = (key: string, value: string) : void => {};
    abstract getItem = (key: string) : string | void => {};
    abstract getJSON = (key: string) : object | void => {};
    abstract setJSON = (key: string, jsonObj: object) : void => {};
}


// LocalStrorage service implementation

export class LocalStorage extends StorageService {
    private storage: Storage

    constructor(persist: boolean = false) {
        super();
        if (!persist) {
            this.storage = sessionStorage
            log.info(`Using sessionStorage as StorageService`)
        } else {
            this.storage = localStorage
            log.info(`Using localStorage as StorageService`)
        }
    }

    setItem = (key: string, value: string): void => {
        this.storage.setItem(key, value)
    }

    getItem = (key: string): string => {
        return this.storage.getItem(key)
    }

    setJSON = (key: string, jsonObj: object): void => {
        let objString = JSON.stringify(jsonObj)
        this.storage.setItem(key, objString)
    }

    getJSON = (key: string): object => {
        let objString = this.storage.getItem(key)
        return JSON.parse(objString)
    }
}