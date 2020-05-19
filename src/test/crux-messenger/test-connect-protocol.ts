import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import 'mocha';
import {cruxConenctProtocol} from "../../infrastructure/implementations";
import {patchMissingDependencies} from "../test-utils";

patchMissingDependencies();

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;


const connectMessageSchemaByType: any = cruxConenctProtocol.reduce((newObj, x) => Object.assign(newObj, {[x.messageType]: x.schema}), {});

describe('Test Connect Protocol', function() {

    describe('type CONNECT_REQUEST tests', function() {
        beforeEach(function() {
            this.messageSchema = connectMessageSchemaByType['CONNECT_REQUEST']
        })
        it('Valid messages', async function() {
            const validConnectRequests = [{
                publicKey: "3abeeb0e5784e8bd0f2420e4231f0134f7b5bb91e0957f77493bacb1c53d5da6"
            },{
                publicKey: "03c2156930598a7e4832ebb8b435abcc657b1f14b7953b2145ae25268dd6141c"
            }];
            for (let msg of validConnectRequests) {
                const result = this.messageSchema.validate(msg)
                console.log(result);
                expect(result.error).to.be.undefined;
            }
        });

        it('Invalid Messages', async function() {
            const invalidConnectRequests = [{},{
                publicKey: {
                    publicKey : "3abeeb0e5784e8bd0f2420e4231f0134f7b5bb91e0957f77493bacb1c53d5da6"
                }
            },{
                publicKey: "",
            },{
                publicKey: "3abeeb0e5784e8bd0f2420e4231f0134f7b5bb91e0957f77493bacb1c53d5da667",
            },{
                publicKey: "",
                cruxId: {
                    id: "release020@cruxdev.crux"
                }
            },{
                publicKey: "3abeeb0e5784e8bd0f2420e4231f0134f7b5bb91e09"
            },{
                publicKey: "3abeeb0e5784e8bd0f2420e4231f0134f7b5bb91e0957f77493bacb1c53d5da6",
                cruxId: ""
            }];
            for (let msg of invalidConnectRequests) {
                const result = this.messageSchema.validate(msg);
                console.log(result)
                expect(result.error).to.not.be.undefined;
            }
        });

    });



})

