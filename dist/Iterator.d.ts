import Op from './Op';
export default class Iterator {
    ops: Op[];
    index: number;
    offset: number;
    constructor(ops: Op[]);
    hasNext(): boolean;
    next(length?: number): Op;
    peek(): Op;
    peekLength(): number;
    peekType(): string;
    rest(): Op[];
}
