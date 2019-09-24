const DEFAULT_CRUX_NAMESPACE = "crux";
const DEFAULT_BLOCKSTACK_NAMESPACE = "id";

interface InputIDComponents {
    domain: string;
    subdomain: string;
}

interface GenericIDComponents {
    domain: string;
    subdomain: string;
    namespace: string;
}

export class CruxId {

    public static validateSubdomain = (subDomain: string) => {
        if (!subDomain.match(new RegExp("[a-z]([a-z]|\d|-|_)*([a-z]|\d)"))) {
            throw new Error("Validation failed, should start with alphabet and end with alphabet or number. Allowed characters - lowercase alphabets, numbers, - and _")
        }
    }
    public static fromString = (stringRepresentation: string) => {
        const arrayCruxId = stringRepresentation.split(/[.@]/);
        let cruxSubdomain: string = "";
        let cruxDomain: string = "";
        let cruxNamespace: string = "";
        if (arrayCruxId.length === 3) {
            [cruxSubdomain, cruxDomain, cruxNamespace] = arrayCruxId; // foo@exodus.crux
        } else if (arrayCruxId.length === 2) {
            if (arrayCruxId[1] !== "crux") {
                throw Error("Invalid Crux ID");
            } else {
                [cruxSubdomain, cruxDomain] = arrayCruxId; // eg. foo@crux
                cruxNamespace = "crux";
            }

        } else {
            throw Error("Invalid Crux ID");
        }

        if (cruxNamespace !== DEFAULT_CRUX_NAMESPACE) {
            throw Error(`Only .${DEFAULT_CRUX_NAMESPACE} namespace is supported in CruxID`);
        }

        return new CruxId({domain: cruxDomain, subdomain: cruxSubdomain});
    }
    public components: GenericIDComponents;
    constructor(inputComponents: InputIDComponents) {
        this.components = {
            ...inputComponents,
            namespace: DEFAULT_CRUX_NAMESPACE,
        };
    }

    public toString = () => {
        const cruxSubdomainPart: string = this.components.subdomain.length > 0 ? this.components.subdomain + "@" : "";
        let otherPart: string;

        if (this.components.domain === DEFAULT_CRUX_NAMESPACE && this.components.namespace === DEFAULT_CRUX_NAMESPACE) {
            otherPart = this.components.domain;
        } else {
            otherPart = this.components.domain + "." + this.components.namespace;
        }

        return cruxSubdomainPart +  otherPart;
    }
}

export class BlockstackId {

    public static fromString = (stringRepresentation: string) => {
        const arrayBsId = stringRepresentation.split(".");
        let bsSubdomain: string = "";
        let bsDomain: string = "";
        let bsNamespace: string = "";
        if (arrayBsId.length === 3) {
            [bsSubdomain, bsDomain, bsNamespace] = arrayBsId;
        } else if (arrayBsId.length === 2) {
            [bsDomain, bsNamespace] = arrayBsId;
        } else {
            throw Error("Invalid Blockstack ID");
        }

        if (bsNamespace !== DEFAULT_BLOCKSTACK_NAMESPACE) {
            throw Error(`Only .${DEFAULT_BLOCKSTACK_NAMESPACE} namespace is supported in BlockstackId`);
        }

        return new BlockstackId({domain: bsDomain, subdomain: bsSubdomain});
    }
    public components: GenericIDComponents;
    constructor(inputComponents: InputIDComponents) {
        this.components = {
            ...inputComponents,
            namespace: DEFAULT_BLOCKSTACK_NAMESPACE,
        };
    }

    public toString = () => {
        const bsSubdomainPart: string = this.components.subdomain.length > 0 ? this.components.subdomain + "." : "";
        return bsSubdomainPart +  this.components.domain + "." + this.components.namespace;
    }
}

export class IdTranslator {
    public static cruxToBlockstack = (cruxId: CruxId): BlockstackId => {
        if (cruxId.components.namespace !== DEFAULT_CRUX_NAMESPACE) {
            throw Error("Crux Namespace must be .crux");
        }
        return new BlockstackId({
            domain: cruxId.components.domain,
            subdomain: cruxId.components.subdomain,
        });
    }
    public static blockstackToCrux = (bsId: BlockstackId): CruxId => {
        if (!bsId.components.subdomain) {
            throw Error(`Subdomain must be non null to be translated`);
        }
        if (bsId.components.namespace !== DEFAULT_BLOCKSTACK_NAMESPACE) {
            throw Error(`Blockstack Namespace must be .id, not ${bsId.components.namespace}`);
        }
        return new CruxId({
            domain: bsId.components.domain,
            subdomain: bsId.components.subdomain,
        });
    }
}
