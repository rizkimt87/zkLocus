import { verify } from 'crypto';
import Decimal from 'decimal.js';

/**
 * Represents a geographic point with latitude and longitude.
 */
export interface RandomGeoPoint {
    latitude: number;
    longitude: number;
}

type TriangleType = 'inside' | 'outside' | 'edge';


/**
 * Generates random geographical points with specific precision constraints.
 */
export default class RandomGeoPointGenerator {
    private generatedTriangles: Map<TriangleType, Set<string>>;

    constructor() {
        this.generatedTriangles = new Map<TriangleType, Set<string>>();
        this.generatedTriangles.set('inside', new Set());
        this.generatedTriangles.set('outside', new Set());
        this.generatedTriangles.set('edge', new Set());
    }


    /**
     * Generates a random coordinate within the specified range and precision.
     * @param min The minimum value for the coordinate.
     * @param max The maximum value for the coordinate.
     * @param precision The number of decimal places.
     * @returns A random coordinate as a number.
     */
    public static generateRandomCoordinate(min: number, max: number, precision: number): number {
        if (precision === 0) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        } else {
            return parseFloat(new Decimal(Decimal.random(precision).mul(max - min).plus(min)).toFixed(precision));
        }
    }

    /**
     * Generates a random geographical point with a specified precision.
     * @returns A random GeoPoint object.
     */
    public static generateRandomZKGeoPoint(): RandomGeoPoint {
        const precision = Math.floor(Math.random() * 8); // 0 to 7 decimal points
        const latitude = this.generateRandomCoordinate(-90, 90, precision);
        const longitude = this.generateRandomCoordinate(-180, 180, precision);
        return { latitude, longitude };
    }

    /**
     * Generates vertices for a triangle based on the given point and type.
     * @param point The reference point.
     * @param type The type of triangle to generate ('inside', 'outside', 'edge').
     * @param precision The precision for the vertices.
     * @returns An array of vertices (GeoPoint objects).
     */
    private static getTriangleVertices(point: RandomGeoPoint, type: 'inside' | 'outside' | 'edge', precision: number): RandomGeoPoint[] {
        let vertices: RandomGeoPoint[] = [];
        const baseOffset = precision > 0 ? new Decimal(0.1): new Decimal(1);
        
        const randomOffset1 = new Decimal(Math.random() * 10).toFixed(precision); // Adding significant random offset
        const randomOffset2 = new Decimal(Math.random() * 10).toFixed(precision); // Adding significant random offset
        const randomOffset3 = new Decimal(Math.random() * 10).toFixed(precision); // Adding significant random offset

        let offset1: string = (type === 'edge' ? baseOffset : baseOffset.plus(randomOffset1)).toString();
        let offset2: string = (type === 'edge' ? baseOffset : baseOffset.plus(randomOffset2)).toString();
        let offset3: string = (type === 'edge' ? baseOffset : baseOffset.plus(randomOffset3)).toString();

        switch (type) {
            case 'inside':
                vertices = [
                    { latitude: point.latitude - parseFloat(offset1), longitude: point.longitude - parseFloat(offset1) },
                    { latitude: point.latitude + parseFloat(offset2), longitude: point.longitude - parseFloat(offset2) },
                    { latitude: point.latitude, longitude: point.longitude + parseFloat(offset3) }
                ]; 
                break;
            case 'outside':
                vertices = [
                    { latitude: point.latitude + parseFloat(offset1), longitude: point.longitude + parseFloat(offset1)},
                    { latitude: point.latitude + parseFloat(offset2), longitude: point.longitude + parseFloat(offset2)},
                    { latitude: point.latitude + parseFloat(offset3), longitude: point.longitude + parseFloat(offset3)}
                ];
                break;
            case 'edge':
                // For 'edge', the offset is not randomized to maintain the point on the edge
                vertices = [
                    { latitude: point.latitude - parseFloat(baseOffset.toString()), longitude: point.longitude - parseFloat(baseOffset.toString()) },
                    { latitude: point.latitude + parseFloat(baseOffset.toString()), longitude: point.longitude + parseFloat(baseOffset.toString()) },
                    point
                ];
                break;
        }

        for (let i = 0; i < vertices.length; i++) {
            if (vertices[i].latitude < -90) {
                vertices[i].latitude = -90;
            }
            if (vertices[i].latitude > 90) {
                vertices[i].latitude = 90;
            }
            if (vertices[i].longitude < -180) {
                vertices[i].longitude = -180;
            }
            if (vertices[i].longitude > 180) {
                vertices[i].longitude = 180;
            }
        }

        return vertices.map(v => ({
            latitude: Number(new Decimal(v.latitude).toFixed(precision)),
            longitude: Number(new Decimal(v.longitude).toFixed(precision))
        }));
    }


    /**
     * Generates a triangle polygon with the given point inside it.
     * @param point The point to be inside the triangle.
     * @returns A triangle polygon as an array of GeoPoints.
     */
    public static generateTriangleWithPointInside(point: RandomGeoPoint): RandomGeoPoint[] {
        const precision = Math.max(point.latitude.toString().split('.')[1]?.length || 0, point.longitude.toString().split('.')[1]?.length || 0);
        return this.getTriangleVertices(point, 'inside', precision);
    }

    /**
     * Generates a triangle polygon with the given point outside it.
     * @param point The point to be outside the triangle.
     * @returns A triangle polygon as an array of GeoPoints.
     */
    public static generateTriangleWithPointOutside(point: RandomGeoPoint): RandomGeoPoint[] {
        const precision = Math.max(point.latitude.toString().split('.')[1]?.length || 0, point.longitude.toString().split('.')[1]?.length || 0);
        return this.getTriangleVertices(point, 'outside', precision);
    }

    /**
     * Generates a triangle polygon with the given point on one of its edges.
     * @param point The point to be on the edge of the triangle.
     * @returns A triangle polygon as an array of GeoPoints.
     */
    public static generateTriangleWithPointOnEdge(point: RandomGeoPoint): RandomGeoPoint[] {
        const precision = Math.max(point.latitude.toString().split('.')[1]?.length || 0, point.longitude.toString().split('.')[1]?.length || 0);
        return this.getTriangleVertices(point, 'edge', precision);
    }

    private checkAndStoreTriangle(triangle: RandomGeoPoint[], type: TriangleType): void {
        const triangleKey = JSON.stringify(triangle);
        if (this.generatedTriangles.get(type)?.has(triangleKey)) {
            throw new Error(`Duplicate triangle generated for type ${type}`);
        }
        this.generatedTriangles.get(type)?.add(triangleKey);
    }

    public generateTriangleWithPointInside(point: RandomGeoPoint): RandomGeoPoint[] {
        const precision = Math.max(point.latitude.toString().split('.')[1]?.length || 0, point.longitude.toString().split('.')[1]?.length || 0);
        const triangle = RandomGeoPointGenerator.getTriangleVertices(point, 'inside', precision);
        this.checkAndStoreTriangle(triangle, 'inside');
        return triangle;
    }

    public generateTriangleWithPointOutside(point: RandomGeoPoint): RandomGeoPoint[] {
        const precision = Math.max(point.latitude.toString().split('.')[1]?.length || 0, point.longitude.toString().split('.')[1]?.length || 0);
        const triangle = RandomGeoPointGenerator.getTriangleVertices(point, 'outside', precision);
        this.checkAndStoreTriangle(triangle, 'outside');
        return triangle;
    }

    public generateTriangleWithPointOnEdge(point: RandomGeoPoint): RandomGeoPoint[] {
        const precision = Math.max(point.latitude.toString().split('.')[1]?.length || 0, point.longitude.toString().split('.')[1]?.length || 0);
        const triangle = RandomGeoPointGenerator.getTriangleVertices(point, 'edge', precision);
        this.checkAndStoreTriangle(triangle, 'edge');
        return triangle;
    }
}
