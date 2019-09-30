import {ErrorHelper, PackageErrorCode} from "./error";

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
        const subdomainRegex: string = "[a-z]([a-z]|\d|-|_)*([a-z]|\d)";
        const subdomainMinLength: number = 4;
        const subdomainMaxLength: number = 20;
        if (!subDomain.match(new RegExp(subdomainRegex))) {
            throw ErrorHelper.getPackageError(PackageErrorCode.SubdomainRegexMatchFailure);
        }
        if (subDomain.length < subdomainMinLength || subDomain.length > subdomainMaxLength) {
            throw ErrorHelper.getPackageError(PackageErrorCode.SubdomainLengthCheckFailure);
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
                throw ErrorHelper.getPackageError(PackageErrorCode.CruxIdNamespaceValidation, arrayCruxId[1]);
            } else {
                [cruxSubdomain, cruxDomain] = arrayCruxId; // eg. foo@crux
                cruxNamespace = "crux";
            }
        } else {
            throw ErrorHelper.getPackageError(PackageErrorCode.CruxIdLengthValidation);
        }

        if (cruxNamespace !== DEFAULT_CRUX_NAMESPACE) {
            throw ErrorHelper.getPackageError(PackageErrorCode.CruxIdNamespaceValidation, cruxNamespace);
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
            throw ErrorHelper.getPackageError(PackageErrorCode.BlockstackIdLengthValidation);
        }

        if (bsNamespace !== DEFAULT_BLOCKSTACK_NAMESPACE) {
            throw ErrorHelper.getPackageError(PackageErrorCode.BlockstackIdNamespaceValidation, bsNamespace);
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
            throw ErrorHelper.getPackageError(PackageErrorCode.CruxIdNamespaceValidation, cruxId.components.namespace);
        }
        return new BlockstackId({
            domain: cruxId.components.domain,
            subdomain: cruxId.components.subdomain,
        });
    }
    public static blockstackToCrux = (bsId: BlockstackId): CruxId => {
        if (!bsId.components.subdomain) {
            throw ErrorHelper.getPackageError(PackageErrorCode.BlockstackIdInvalidSubdomain);
        }
        if (bsId.components.namespace !== DEFAULT_BLOCKSTACK_NAMESPACE) {
            throw ErrorHelper.getPackageError(PackageErrorCode.BlockstackIdNamespaceValidation, bsId.components.namespace);
        }
        return new CruxId({
            domain: bsId.components.domain,
            subdomain: bsId.components.subdomain,
        });
    }
}
