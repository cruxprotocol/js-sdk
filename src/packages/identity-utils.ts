import {ErrorHelper, PackageErrorCode} from "./error";

const DEFAULT_CRUX_NAMESPACE = "crux";
export const DEFAULT_BLOCKSTACK_NAMESPACE = "id";
export const CRUX_DOMAIN_SUFFIX = "_crux";

interface InputIDComponents {
    domain: string;
    subdomain: string;
}

interface GenericIDComponents {
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

export class IdTranslator {
    public static cruxDomainToBlockstackDomain = (domain: string): string => {
        return domain + CRUX_DOMAIN_SUFFIX;
    }
    public static blockstackDomainToCruxDomain = (domain: string): string => {
        // TODO: add validation on the input domain;
        return domain.slice(0, -5);
    }
    public static cruxToBlockstack = (cruxId: CruxId): BlockstackId => {
        if (cruxId.components.namespace !== DEFAULT_CRUX_NAMESPACE) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.CruxIdNamespaceValidation, cruxId.components.namespace);
        }
        return new BlockstackId({
            domain: IdTranslator.cruxDomainToBlockstackDomain(cruxId.components.domain),
            subdomain: cruxId.components.subdomain,
        });
    }
    public static blockstackToCrux = (bsId: BlockstackId): CruxId => {
        if (!bsId.components.subdomain) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BlockstackIdInvalidSubdomainForTranslation);
        }
        if (bsId.components.namespace !== DEFAULT_BLOCKSTACK_NAMESPACE) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BlockstackIdNamespaceValidation, bsId.components.namespace);
        }
        if (!bsId.components.domain.endsWith(CRUX_DOMAIN_SUFFIX)) {
            throw ErrorHelper.getPackageError(null, PackageErrorCode.BlockstackIdInvalidDomainForTranslation);
        }
        const cruxDomain = IdTranslator.blockstackDomainToCruxDomain(bsId.components.domain);

        return new CruxId({
            domain: cruxDomain,
            subdomain: bsId.components.subdomain,
        });
    }
}
