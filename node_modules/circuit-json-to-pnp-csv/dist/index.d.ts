import { AnyCircuitElement, LayerRef } from 'circuit-json';

interface PickAndPlaceRow {
    designator: string;
    mid_x: number;
    mid_y: number;
    layer: LayerRef;
    rotation: number;
}
declare const convertCircuitJsonToPickAndPlaceRows: (circuitJson: AnyCircuitElement[], opts?: {
    flip_y_axis?: boolean;
}) => PickAndPlaceRow[];
declare const convertCircuitJsonToPickAndPlaceCsv: (circuitJson: AnyCircuitElement[]) => string;

export { convertCircuitJsonToPickAndPlaceCsv, convertCircuitJsonToPickAndPlaceRows };
