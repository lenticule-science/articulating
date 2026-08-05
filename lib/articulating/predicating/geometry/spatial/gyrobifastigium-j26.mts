/** A concrete Euclidean presentation of the J26 incidence law proved in Lean. */
export type J26VertexName = "q0" | "q1" | "q2" | "q3" | "a" | "b" | "c" | "d";

export type J26Face = Readonly<{
  name: string;
  vertices: readonly J26VertexName[];
}>;

const h = Math.sqrt(3) / 2;

export const gyrobifastigiumJ26 = Object.freeze({
  type: "GyrobifastigiumJ26",
  vertices: Object.freeze({
    q0: Object.freeze([0, -0.5, -0.5]),
    q1: Object.freeze([0, 0.5, -0.5]),
    q2: Object.freeze([0, 0.5, 0.5]),
    q3: Object.freeze([0, -0.5, 0.5]),
    a: Object.freeze([-h, 0, -0.5]),
    b: Object.freeze([-h, 0, 0.5]),
    c: Object.freeze([h, 0.5, 0]),
    d: Object.freeze([h, -0.5, 0]),
  }) satisfies Readonly<Record<J26VertexName, readonly number[]>>,
  faces: Object.freeze([
    Object.freeze({ name: "leftTop", vertices: ["q0", "q1", "a"] as const }),
    Object.freeze({ name: "leftBottom", vertices: ["q3", "q2", "b"] as const }),
    Object.freeze({ name: "leftSide0", vertices: ["q1", "a", "b", "q2"] as const }),
    Object.freeze({ name: "leftSide1", vertices: ["a", "q0", "q3", "b"] as const }),
    Object.freeze({ name: "rightTop", vertices: ["q1", "q2", "c"] as const }),
    Object.freeze({ name: "rightBottom", vertices: ["q0", "q3", "d"] as const }),
    Object.freeze({ name: "rightSide0", vertices: ["q2", "c", "d", "q3"] as const }),
    Object.freeze({ name: "rightSide1", vertices: ["c", "q1", "q0", "d"] as const }),
  ] satisfies readonly J26Face[]),
});
