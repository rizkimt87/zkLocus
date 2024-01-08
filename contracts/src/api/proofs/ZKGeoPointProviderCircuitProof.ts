import { JsonProof} from "o1js";
import { GeoPointProviderCircuit, GeoPointProviderCircuitProof } from "../../zkprogram/private/Geography";
import { IO1JSProof } from "./Types";
import { ZKLocusProof } from "./ZKLocusProof";
import { GeoPoint } from "../../model/Geography";
import { ZKGeoPoint } from "../models/ZKGeoPoint";
import CachingProofVerificationMiddleware from "./middleware/CachingProofVerificationMiddleware";
import { OracleGeoPointProviderCircuitProof} from "../../zkprogram/private/Oracle";
import { ZKOracleGeoPointProviderCircuitProof } from "./ZKOracleGeoPointProviderCircuitProof";

/*
* Authenticated GeoPoint source proof. This is an abstraction over the set of Zero-Knowledge proof that is used to
* prove that a GeoPoint was provided by a trusted source. It can be used to prove that a GeoPoint was provided by
* a trusted source, such as an Oracle.
*
* This class is an abstraction over the GeoPointProviderCircuitProof class, which is the actual zero-knowledge proof.
* The proof is not generated by this class, but rather passed to it in the constructor. In order to generate a proof
* from an Oracle, use the methods of ZKGeoPoint class.
*/
@CachingProofVerificationMiddleware
export class ZKGeoPointProviderCircuitProof extends ZKLocusProof<GeoPointProviderCircuitProof> {
    protected _proof: GeoPointProviderCircuitProof;
    protected static _circuit = GeoPointProviderCircuit; 
    protected static _dependentProofs = [
        ZKOracleGeoPointProviderCircuitProof,
    ]

    constructor(proof: GeoPointProviderCircuitProof) {
        super();
        this._proof = proof;
    }

    static fromJSON(jsonProof: JsonProof): IO1JSProof {
        return GeoPointProviderCircuitProof.fromJSON(jsonProof);
    }

    get zkGeoPoint(): ZKGeoPoint {
        this.verify();
        const geoPoint:GeoPoint = this._proof.publicOutput;
        return ZKGeoPoint.fromGeoPoint(geoPoint);
    }

    /**
     * Creates a ZKGeoPointProviderCircuitProof from a ZKGeoPointSignatureVerificationCircuitProof and a ZKGeoPoint.
     * @param proof - The ZKGeoPointSignatureVerificationCircuitProof to create the ZKGeoPointProviderCircuitProof from.
     * @param zkGeoPoint - The ZKGeoPoint to use in the creation of the ZKGeoPointProviderCircuitProof.
     * @returns A Promise that resolves to a ZKGeoPointProviderCircuitProof.
     */
    static async fromOracleSignatureProof(proof: ZKOracleGeoPointProviderCircuitProof): Promise<ZKGeoPointProviderCircuitProof> {
        proof.verify();
        const zkGeoPoint: ZKGeoPoint = proof.zkGeoPoint;
        const sigVerificationProof: OracleGeoPointProviderCircuitProof = proof.proof;
        const geoPoint: GeoPoint = zkGeoPoint.toGeoPoint();
        const geoPointProviderProof: GeoPointProviderCircuitProof = await GeoPointProviderCircuit.fromOracle(
            sigVerificationProof,
            geoPoint,
        )
        return new ZKGeoPointProviderCircuitProof(geoPointProviderProof);
    }
}