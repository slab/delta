interface AttributeMap {
    [key: string]: any;
}
declare namespace AttributeMap {
    function compose(a: AttributeMap | undefined, b: AttributeMap | undefined, keepNull: boolean): AttributeMap | undefined;
    function diff(a?: AttributeMap, b?: AttributeMap): AttributeMap | undefined;
    function invert(attr?: AttributeMap, base?: AttributeMap): AttributeMap;
    function transform(a: AttributeMap | undefined, b: AttributeMap | undefined, priority?: boolean): AttributeMap | undefined;
}
export default AttributeMap;
