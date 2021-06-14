import AttributeMap from './AttributeMap';
import Iterator from './Iterator';
interface Op {
    insert?: string | Record<string, any>;
    delete?: number;
    retain?: number | Record<string, any>;
    attributes?: AttributeMap;
}
declare namespace Op {
    function iterator(ops: Op[]): Iterator;
    function length(op: Op): number;
}
export default Op;
