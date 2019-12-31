import {ErrorHelper, PackageErrorCode} from "./error";

export const DEFAULT_CRUX_NAMESPACE = "crux";
export const DEFAULT_BLOCKSTACK_NAMESPACE = "id";
export const CRUX_DOMAIN_SUFFIX = "_crux";

export interface InputIDComponents {
    domain: string;
    subdomain: string;
}

export interface GenericIDComponents {
    domain: string;
    subdomain: string;
    namespace: string;
}

export const validateSubdomain = (subDomain: string) => {
    const subdomainRegex: string = "^[a-z]([a-z]|[0-9]|-|_)*([a-z]|[0-9])$";
    const subdomainMinLength: number = 4;
    const subdomainMaxLength: number = 20;
    if (!subDomain.match(new RegExp(subdomainRegex))) {
        throw ErrorHelper.getPackageError(null, PackageErrorCode.SubdomainRegexMatchFailure);
    }
    if (subDomain.length < subdomainMinLength || subDomain.length > subdomainMaxLength) {
        throw ErrorHelper.getPackageError(null, PackageErrorCode.SubdomainLengthCheckFailure);
    }
};

export class CruxId {
    public static fromString = (stringRepresentation: string) => {
        const arrayCruxId = stringRepresentation.split(/[.@]/);
        let cruxSubdomain: string = "";
        let cruxDomain: string = "";
        let cruxNamespace: string = "";
        if (arrayCruxId.length === 3) {
            [cruxSubdomain, cruxDomain, cruxNamespace] = arrayCruxId; // foo@exodus.crux
        } else {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CruxIdInvalidStructure);
        }

        if (cruxNamespace !== DEFAULT_CRUX_NAMESPACE) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CruxIdNamespaceValidation, cruxNamespace);
        }

        return new CruxId({domain: cruxDomain, subdomain: cruxSubdomain});
    }
    public components: GenericIDComponents;
    constructor(inputComponents: InputIDComponents) {
        // validateSubdomain(inputComponents.subdomain);
        this.components = {
            ...inputComponents,
            namespace: DEFAULT_CRUX_NAMESPACE,
        };
    }

    public toString = () => {
        const cruxSubdomainPart: string = this.components.subdomain + "@";
        const otherPart = this.components.domain + "." + this.components.namespace;
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
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BlockstackIdInvalidStructure);
        }

        if (bsNamespace !== DEFAULT_BLOCKSTACK_NAMESPACE) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BlockstackIdNamespaceValidation, bsNamespace);
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

export interface GenericDomainComponents {
    domain: string;
    namespace: string;
}

// CruxDomainId("cruxdev")
export class CruxDomainId {
    public static fromString = (stringRepresentation: string) => {
        const arrayCruxId = stringRepresentation.split(/[.@]/);
        let cruxDomain: string = "";
        let cruxNamespace: string = "";
        if (arrayCruxId.length === 2) {
            [cruxDomain, cruxNamespace] = arrayCruxId; // exodus.crux
        } else {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CruxDomainInvalidStructure);
        }
        if (cruxNamespace !== DEFAULT_CRUX_NAMESPACE) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CruxDomainNamespaceValidation, cruxNamespace);
        }
        return new CruxDomainId(cruxDomain);
    }
    public components: GenericDomainComponents;
    constructor(domain: string) {
        this.components = {
            domain,
            namespace: DEFAULT_CRUX_NAMESPACE,
        };
    }
    public toString = (): string => {
        return `${this.components.domain}.${this.components.namespace}`;
    }
}

export class BlockstackDomain {
    public static fromString = (stringRepresentation: string) => {
        const arrayBsId = stringRepresentation.split(".");
        let bsDomain: string = "";
        let bsNamespace: string = "";
        if (arrayBsId.length === 2) {
            [bsDomain, bsNamespace] = arrayBsId;
        } else if (arrayBsId.length === 2) {
            [bsDomain, bsNamespace] = arrayBsId;
        } else {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BlockstackDomainInvalidStructure);
        }
        if (bsNamespace !== DEFAULT_BLOCKSTACK_NAMESPACE) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BlockstackDomainNamespaceValidation, bsNamespace);
        }
        return new BlockstackDomain(bsDomain);
    }
    public components: GenericDomainComponents;
    constructor(domain: string) {
        this.components = {
            domain,
            namespace: DEFAULT_BLOCKSTACK_NAMESPACE,
        };
    }
    public toString = (): string => {
        return `${this.components.domain}.${this.components.namespace}`;
    }
}

export class IdTranslator {
    public static cruxDomainToBlockstackDomain = (cruxDomain: CruxDomainId): BlockstackDomain => {
        if (cruxDomain.components.namespace !== DEFAULT_CRUX_NAMESPACE) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CruxDomainNamespaceValidation, cruxDomain.components.namespace);
        }
        return new BlockstackDomain(IdTranslator.cruxDomainStringToBlockstackDomainString(cruxDomain.components.domain));
    }
    public static blockstackDomainToCruxDomain = (blockstackDomain: BlockstackDomain): CruxDomainId => {
        if (blockstackDomain.components.namespace !== DEFAULT_BLOCKSTACK_NAMESPACE) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CruxDomainNamespaceValidation, blockstackDomain.components.namespace);
        }
        return new CruxDomainId(blockstackDomain.components.domain);
    }
    public static cruxIdToBlockstackId = (cruxId: CruxId): BlockstackId => {
        if (cruxId.components.namespace !== DEFAULT_CRUX_NAMESPACE) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CruxIdNamespaceValidation, cruxId.components.namespace);
        }
        return new BlockstackId({
            domain: IdTranslator.cruxDomainStringToBlockstackDomainString(cruxId.components.domain),
            subdomain: cruxId.components.subdomain,
        });
    }
    public static blockstackIdToCruxId = (blockstackId: BlockstackId): CruxId => {
        if (!blockstackId.components.subdomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BlockstackIdInvalidSubdomainForTranslation);
        }
        if (blockstackId.components.namespace !== DEFAULT_BLOCKSTACK_NAMESPACE) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BlockstackIdNamespaceValidation, blockstackId.components.namespace);
        }
        if (!blockstackId.components.domain.endsWith(CRUX_DOMAIN_SUFFIX)) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.InvalidBlockstackDomainForTranslation);
        }
        return new CruxId({
            domain: IdTranslator.blockstackDomainStringToCruxDomainString(blockstackId.components.domain),
            subdomain: blockstackId.components.subdomain,
        });
    }
    public static blockstackDomainStringToCruxDomainString = (domainString: string): string => {
        const match = domainString.match(new RegExp("^(.+)_crux$"));
        if (!match) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.InvalidBlockstackDomainForTranslation);
        }
        return match[1];
    }
    public static cruxDomainStringToBlockstackDomainString = (cruxDomainString: string): string => {
        return `${cruxDomainString}_crux`;
    }
    public static cruxToBlockstack = (crux: CruxId|CruxDomainId): BlockstackId|BlockstackDomain => {
        if (crux instanceof CruxDomainId) {
            return IdTranslator.cruxDomainToBlockstackDomain(crux);
        } else {
            return IdTranslator.cruxIdToBlockstackId(crux);
        }
    }
    public static blockstackToCrux = (crux: BlockstackId|BlockstackDomain): CruxId|CruxDomainId => {
        if (crux instanceof BlockstackDomain) {
            return IdTranslator.blockstackDomainToCruxDomain(crux);
        } else {
            return IdTranslator.blockstackIdToCruxId(crux);
        }
    }
}
