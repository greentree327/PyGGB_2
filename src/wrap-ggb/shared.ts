import {
  SkulptApi,
  SkObject,
  SkInt,
  SkFloat,
  SkString,
  KeywordArgsArray,
} from "../shared/vendor-types/skulptapi";
import { GgbApi } from "../shared/vendor-types/ggbapi";
import { colorIntsFromString, interpretColorOrFail } from "./color";
import { wrapExistingGgbObject} from "./type-registry"; // added custom utilities
import { OperationSlots, operationSlots } from "./operations";

/** A Skulpt object which is also a wrapped GeoGebra object. */
export interface SkGgbObject extends SkObject {
  $ggbLabel: string;
  $updateHandlers: Array<any>;
  $fireUpdateEvents(...args: Array<any>): any;
}

declare var Sk: SkulptApi;

/** Spec to indicate that we should construct a new Skulpt/Python
 * wrapper for an existing GeoGebra object. */
export type WrapExistingCtorSpec = {
  kind: "wrap-existing";
  label: string;
};

/** Something which is constructible from a "spec" argument of the given
 * `SpecT` type, giving an object of the given `ObjectT` type.  */
export interface SpecConstructible<SpecT, ObjectT> {
  new (spec: SpecT): ObjectT;
}

/** Given a JavaScript number `x`, return a string representation of `x`
 * which GeoGebra will interpret correctly.  We don't want to feed
 * exponential notation in the form "4.1693084667370053e-38" directly to
 * GeoGebra.
 * */
export const strOfNumber = (x: number): string => {
  const jsStr = x.toExponential();
  const [sig, exp] = jsStr.split("e");
  return `(${sig}*10^(${exp}))`;
};

/** Given a JavaScript boolean `x`, return a string representation of
 * `x` which GeoGebra will interpret correctly.
 * */
export const strOfBool = (x: boolean): string => x.toString();

/** Given a Skulpt/PyGgb object `cls`, which should be a class object,
 * return a predicate function which tests whether a given Skulpt/PyGgb
 * object is (in the Python sense) an instance of that class.
 *
 * This is a two-step process to facilitate using, for example,
 * `isInstance(someClass)` as the predicate argument of an
 * `Array.every()` call. */
export const isInstance = (cls: SkObject) => (obj: SkObject) =>
  Sk.builtin.isinstance(obj, cls).v;

function _isGgbObject(obj: SkObject): obj is SkGgbObject { // the function takes in an SkObject, and the return type: obj is SkGgbObject; is a Typescript predicate, which means that the function doesn't just return True/False, it tells Typescript that if the function returns true, then obj can be treated as SkGgbObject in the subsequent code
  return "$ggbLabel" in obj; // the "in" operator checks if the string "$ggbLabel" is a key/property in the object obj; If yes, return True
} // 

function _ggbType(ggbApi: GgbApi, objOrLabel: SkGgbObject | string): string {
  if (typeof objOrLabel === "string") {
    return ggbApi.getObjectType(objOrLabel);
  } else {
    return ggbApi.getObjectType(objOrLabel.$ggbLabel);
  }
}

/** Test whether the Skulpt/PyGgb object `obj` is an `SkGgbObject` of
 * the given GeoGebra type `requiredType` (for example, `"circle"`).  If
 * `requiredType` is omitted, test only whether `obj` is an
 * `SkGgbObject`.  The given `ggbApi` is used to get the object's
 * GeoGebra type.
 * */
export const isGgbObject = (
  ggbApi: GgbApi,
  obj: SkObject,
  requiredType?: string // an optional parameter
): obj is SkGgbObject => {
  // Could collapse the following into one bool expression but it wouldn't
  // obviously be clearer.

  if (!_isGgbObject(obj)) return false;

  // It is a GGB object.  If we're not fussy about what type, we're done.
  if (requiredType == null) return true;

  // We are fussy about what type; compare.
  const gotType = ggbApi.getObjectType(obj.$ggbLabel);
  return gotType === requiredType;
};

/** Test whether every element of a (JavaScript) array is an
 * `SkGgbObject`.  This is provided explicitly (rather than letting
 * callers use `xs.every(⋯)` instead) to help TypeScript with its
 * type-narrowing. */
const everyElementIsGgbObject = (
  objs: Array<SkObject>
): objs is Array<SkGgbObject> => objs.every(_isGgbObject);

const _everyElementIsGgbObjectOfType = (
  ggbApi: GgbApi,
  objs: Array<SkObject>,
  requiredType: string
): objs is Array<SkGgbObject> =>
  objs.every((obj) => isGgbObject(ggbApi, obj, requiredType));

/** Test whether the Skulpt/PyGgb object `obj` is either a Skulpt/Python
 * number or a GeoGebra `numeric` object. */
export const isPythonOrGgbNumber = (ggbApi: GgbApi, obj: SkObject) =>
  Sk.builtin.checkNumber(obj) || isGgbObject(ggbApi, obj, "numeric"); // returns true in either cases, 

/** Test whether the given array of strings is `[""]`, i.e., a
 * one-element list whose only element is the empty string. */
export const isSingletonOfEmpty = (xs: Array<string>) =>
  xs.length === 1 && xs[0] === "";

/** Given a Skulpt/PyGgb object `x`, which should be either a `numeric`
 * GeoGebra object or a Python number, return a string suitable for
 * inclusion in a GeoGebra command.  For a `numeric` object, return its
 * label.  For a Python number, return a literal string representation.
 * */
export const numberValueOrLabel = (ggbApi: GgbApi, x: SkObject): string => { // takes in a value x
  if (isGgbObject(ggbApi, x, "numeric")) { // if x is a Geogebra numeric object
    return x.$ggbLabel; // return the label of x
  }

  if (Sk.builtin.checkNumber(x)) { // if x is a python number
    const jsStr = x.v.toExponential(); // use JavaScript's toExponential() to convert the number into exponential function
    const [sig, exp] = jsStr.split("e");
    return `(${sig}*10^(${exp}))`; // reformats into Geogebra's syntax
  }

  // TODO: Can we tighten types to avoid this runtime check?
  throw new Sk.builtin.RuntimeError("internal error: not Number or number");
};

/** Set the attributes in `propNamesValue` (typically Python properties)
 * on the given `obj`, and return `obj`.  The attribute/property names
 * (JavaScript strings) and values (`SkObject` instances) should
 * alternate in the `propNamesValues` array. */
export const withPropertiesFromNameValuePairs = (
  obj: SkObject,
  propNamesValues?: KeywordArgsArray
) => {
  propNamesValues = propNamesValues ?? [];

  if (propNamesValues.length % 2 !== 0) {
    throw new Sk.builtin.RuntimeError(
      "internal error: propNamesValues not in pairs"
    );
  }

  for (let i = 0; i !== propNamesValues.length; i += 2) {
    // Not easy to tell TypeScript that the name/value pairs alternate
    // within the array, so help it:
    const propName = propNamesValues[i] as string;
    const propPyName = new Sk.builtin.str(propName);
    const propValue = propNamesValues[i + 1] as SkObject;
    obj.tp$setattr(propPyName, propValue);
  }

  return obj;
};

/** Assert that the given `obj` wraps a GeoGebra object.  If not, throw
 * a `TypeError` whose message uses the given `objName`.
 * */
function throwIfNotGgbObject(
  obj: SkObject,
  objName: string
): asserts obj is SkGgbObject {
  if (!_isGgbObject(obj)) {
    throw new Sk.builtin.TypeError(`${objName} must be a GeoGebra object`);
  }
}

/** Assert that the given `obj` wraps a GeoGebra object of the given
 * `requiredType` GeoGebra type.  If not, throw a `TypeError` whose
 * message uses the given `objName`.  The given `ggbApi` is used to find
 * the type of GeoGebra object wrapped.
 * */
function throwIfNotGgbObjectOfType(
  ggbApi: GgbApi,
  obj: SkObject,
  requiredType: string,
  objName: string
): asserts obj is SkGgbObject {
  if (!isGgbObject(ggbApi, obj, requiredType)) {
    throw new Sk.builtin.TypeError(
      `${objName} must be a GeoGebra object of type "${requiredType}"`
    );
  }
}

/** Assert that the given `obj` is either a Python number, or wraps a
 * GeoGebra "numeric" object.  If not, throw a `TypeError` whose message
 * uses the given `objName`.  The given `ggbApi` is used to find the
 * type of GeoGebra object wrapped.
 * */
function throwIfNotPyOrGgbNumber(
  ggbApi: GgbApi,
  obj: SkObject,
  objName: string
): asserts obj is SkInt | SkFloat | SkGgbObject {
  const isPyNumber = Sk.builtin.checkNumber(obj);
  const isGgbNumber = isGgbObject(ggbApi, obj, "numeric");
  const isSomeNumber = isPyNumber || isGgbNumber;
  if (!isSomeNumber) {
    throw new Sk.builtin.TypeError(
      `${objName} must be a Python number or GeoGebra numeric`
    );
  }
}

/** Assert that the given `pyObj` is a Python string.  If not, throw a
 * `TypeError`, whose message uses the given `objName`. */
export function throwIfNotString(
  pyObj: SkObject,
  objName: string
): asserts pyObj is SkString {
  if (!Sk.builtin.checkString(pyObj))
    throw new Sk.builtin.TypeError(`${objName} must be a string`);
}

/** Assert that the given `pyObj` is a Python number.  If not, throw a
 * `TypeError`, whose message uses the given `objName`. */
export function throwIfNotNumber(
  pyObj: SkObject,
  objName: string
): asserts pyObj is SkInt | SkFloat {
  if (!Sk.builtin.checkNumber(pyObj))
    throw new Sk.builtin.TypeError(`${objName} must be a number`);
}

/** Assert that the given `label` is not `null`.  If it is, throw a
 * `ValueError` with the given `message`.  Intended to be used after
 * evaluating a GeoGebra command where we have no (easy) way of telling
 * whether it will succeed, and have to leave that decision to GeoGebra.
 * */
export function throwIfLabelNull(
  label: string | null,
  message: string
): asserts label is string {
  if (label == null) {
    throw new Sk.builtin.ValueError(message);
  }
}

/** Assemble a full GeoGebra command from the base `command` and the
 * array of string `args`. */
export const assembledCommand = (command: string, args: Array<string>) =>
  `${command}(${args.join(",")})`; // joins the argument array with a comma

export type GgbEvalCmdOptions = {
  allowNullLabel: boolean;
};

const kGgbEvalCmdOptionsDefaults: GgbEvalCmdOptions = {
  allowNullLabel: false,
};
////////////////////////////////////////////// modified evalCmdMultiple (custom utility function that uses ggbApi.evalCommandGetLabels /////////////////////////////////////////////////////////
export const evalCmdMultiple = (ggbApi: GgbApi, cmd: string): string[] => {
  // Execute the command and get the result
  const result = ggbApi.evalCommandGetLabels(cmd);

  if (typeof result === "string") {
    // Handle concatenated labels (e.g., "E,F")
    if (result.includes(",")) {
      return result.split(",").map(label => label.trim());
    }
    // Single label, return it as an array
    return [result];
  } else if (Array.isArray(result)) {
    // Multiple labels, return as-is
    return result;
  }

  // No result, return an empty array
  return [];
};

////////////////////////////////////////////// modified evalCmdMultiple /////////////////////////////////////////////////////////

/** Set the `$ggbLabel` property of the given `obj` from the result of
 * executing the given `fullCommand`.  Curried for more concise use
 * within a constructor. */
export const setGgbLabelFromCmd = // =: assigns the function(defined in the subsequent lines) to setGgbLabelFromCmd
  (ggb: AugmentedGgbApi, obj: SkGgbObject) => // this is the first function (higher ordered function)
  (fullCommand: string, userOptions?: Partial<GgbEvalCmdOptions>) => { // this is the inner arrow function returned by the first function
    const options: Required<GgbEvalCmdOptions> = Object.assign( // Declares a constant options with the type Required<GgbEvalCmdOptions>, the Requied<T> utility type in .ts makes all properties of T required
      Object.assign({}, kGgbEvalCmdOptionsDefaults),
      userOptions ?? {}
    );
    const lbl = ggb.evalCmd(fullCommand); // Evaluate the Geogebra command
    if (lbl == null && !options.allowNullLabel) {
      throw new Sk.builtin.RuntimeError(
        `Ggb command "${fullCommand}" returned null`
      );
    }
    obj.$ggbLabel = lbl; // Assign the Label to the Geogebra Object
  };

/** Assembles a command from provided arguments, and then 
 * calls setGgbLabelFromCmd
*/
export const setGgbLabelFromArgs =
  (ggb: AugmentedGgbApi, obj: SkGgbObject, command: string) =>
  (args: Array<string>, userOptions?: Partial<GgbEvalCmdOptions>) => {
    const fullCommand = assembledCommand(command, args); // `${args[0]} = ${command}[${args.slice(1).join(", ")}]`
    setGgbLabelFromCmd(ggb, obj)(fullCommand, userOptions);
  };

// The only type we use:
type FastCallMethod = (
  this: SkGgbObject,
  args: Array<SkObject>,
  kwargs: KeywordArgsArray
) => SkObject;

type MethodDescriptor = {
  $flags: { [key: string]: boolean };
  $meth: FastCallMethod;
};

type MethodDescriptorsSlice = {
  [methodName: string]: MethodDescriptor;
};

/** Method descriptors slice defining the Python method
 * `with_properties()`.  Suitable for spreading into the `methods`
 * property of the options object passed to `buildNativeClass()`. */
const withPropertiesMethodsSlice: MethodDescriptorsSlice = {
  with_properties: {
    $flags: { FastCall: true },
    $meth(args, kwargs) {
      if (args.length !== 0)
        throw new Sk.builtin.TypeError("expecting only kwargs");
      return withPropertiesFromNameValuePairs(this, kwargs);
    },
  },
};

/** Method descriptors slice defining the Python method `free_copy()`.
 * Suitable for spreading into the `methods` property of the options
 * object passed to `buildNativeClass()`. */
const freeCopyMethodsSlice = (ggbApi: GgbApi): MethodDescriptorsSlice => ({
  free_copy: {
    $flags: { NoArgs: true },
    $meth(this: SkGgbObject) {
      const ggbCmd = `CopyFreeObject(${this.$ggbLabel})`;
      const label = ggbApi.evalCommandGetLabels(ggbCmd);
      return wrapExistingGgbObject(ggbApi, label);
    },
  },
});

/** EXPERIMENTAL: Using this is very likely to lead to (at best)
 * unhelpful error messages if the code tries to use a deleted Ggb
 * object.  Future work on this is likely to involve:
 *
 * Set `obj.$ggbLabel` to `null` after deletion.
 *
 * Wrap (on the TypeScript side) all uses of the bare property
 * `$ggbLabel` with an actual property (with getter) or method.  That
 * getter/method will throw a descriptive error if `$ggbLabel` is null.
 * */
const deleteMethodsSlice = (ggbApi: GgbApi): MethodDescriptorsSlice => ({
  // "delete" is reserved word for Skulpt; use mangled name:
  delete_$rw$: {
    $flags: { NoArgs: true },
    $meth(this: SkGgbObject) {
      ggbApi.deleteObject(this.$ggbLabel);
      return Sk.builtin.none.none$;
    },
  },
});

type ReadOnlyProperty = {
  $get(this: SkGgbObject): SkObject;
};
type ReadWriteProperty = ReadOnlyProperty & {
  $set(this: SkGgbObject, val: SkObject): void;
};

type SharedGetSets = {
  is_visible: ReadWriteProperty;
  is_independent: ReadOnlyProperty;
  value: ReadWriteProperty;
  opacity: ReadWriteProperty;
  color: ReadWriteProperty;
  color_floats: ReadOnlyProperty;
  size: ReadWriteProperty;
  line_thickness: ReadWriteProperty;
  label_visible: ReadWriteProperty;
  label_style: ReadWriteProperty;
  caption: ReadWriteProperty;
  _ggb_exists: ReadOnlyProperty;
  _ggb_type: ReadOnlyProperty;
};

/** Construct and return an object which contains various common
 * property definitions, which use the given `ggbApi` for interaction
 * with GeoGebra.  The returned object is suitable for inclusion in the
 * `getsets` property of the options used in `buildNativeClass()`;
 * alternatively, a subset of its properties can be used like that. */
const sharedGetSets = (ggbApi: GgbApi): SharedGetSets => ({
  is_visible: {
    $get(this: SkGgbObject) {
      return new Sk.builtin.bool(ggbApi.getVisible(this.$ggbLabel));
    },
    $set(this: SkGgbObject, pyIsVisible: SkObject) {
      const isVisible = Sk.misceval.isTrue(pyIsVisible);
      ggbApi.setVisible(this.$ggbLabel, isVisible);
    },
  },
  is_independent: {
    $get(this: SkGgbObject) {
      return new Sk.builtin.bool(ggbApi.isIndependent(this.$ggbLabel));
    },
  },
  value: {
    $get(this: SkGgbObject) {
      return new Sk.builtin.float_(ggbApi.getValue(this.$ggbLabel));
    },
    $set(this: SkGgbObject, pyValue: SkObject) {
      throwIfNotNumber(pyValue, "value");
      ggbApi.setValue(this.$ggbLabel, pyValue.v);
    },
  },
  opacity: {
    $get(this: SkGgbObject) {
      return new Sk.builtin.float_(ggbApi.getFilling(this.$ggbLabel));
    },
    $set(this: SkGgbObject, pyValue: SkObject) {
      throwIfNotNumber(pyValue, "opacity");
      // Ggb ignores values outside [0, 1]; behave the same.
      ggbApi.setFilling(this.$ggbLabel, pyValue.v);
    },
  },
  color: {
    $get(this: SkGgbObject) {
      const color = ggbApi.getColor(this.$ggbLabel);
      return new Sk.builtin.str(color);
    },
    $set(this: SkGgbObject, pyColor: SkObject) {
      const mRGB = interpretColorOrFail(pyColor);
      ggbApi.setColor(this.$ggbLabel, ...mRGB);
    },
  },
  color_floats: {
    $get(this: SkGgbObject) {
      const color = ggbApi.getColor(this.$ggbLabel);
      const jsRgb = colorIntsFromString(color);
      const pyRgb = jsRgb.map((x) => new Sk.builtin.float_(x / 255.0));
      return new Sk.builtin.tuple(pyRgb);
    },
  },
  size: {
    $get(this: SkGgbObject) {
      return new Sk.builtin.float_(ggbApi.getPointSize(this.$ggbLabel));
    },
    $set(this: SkGgbObject, pySize: SkObject) {
      throwIfNotNumber(pySize, "size must be a number");
      // TODO: Verify integer and in range [1, 9]
      ggbApi.setPointSize(this.$ggbLabel, pySize.v);
    },
  },
  line_thickness: {
    $get(this: SkGgbObject) {
      return new Sk.builtin.int_(ggbApi.getLineThickness(this.$ggbLabel));
    },
    $set(this: SkGgbObject, pyThickness: SkObject) {
      throwIfNotNumber(pyThickness, "line_thickness must be a number");
      // TODO: Verify integer and in range [1, 13]
      ggbApi.setLineThickness(this.$ggbLabel, pyThickness.v);
    },
  },
  label_visible: {
    $get(this: SkGgbObject) {
      return new Sk.builtin.bool(ggbApi.getLabelVisible(this.$ggbLabel));
    },
    $set(this: SkGgbObject, pyVisible: SkObject) {
      const visible = Sk.misceval.isTrue(pyVisible);
      ggbApi.setLabelVisible(this.$ggbLabel, visible);
    },
  },
  label_style: {
    $get(this: SkGgbObject) {
      return new Sk.builtin.int_(ggbApi.getLabelStyle(this.$ggbLabel));
    },
    $set(this: SkGgbObject, pyStyle: SkObject) {
      throwIfNotNumber(pyStyle, "label_style must be a number");
      const style = pyStyle.v;
      if (style !== 0 && style !== 1 && style !== 2 && style !== 3)
        throw new Sk.builtin.ValueError(
          "label_style must be one of:" +
            " 0 (name), 1 (name and value)," +
            " 2 (value), or 3 (caption)"
        );
      ggbApi.setLabelStyle(this.$ggbLabel, pyStyle.v);
    },
  },
  caption: {
    $get(this: SkGgbObject) {
      return new Sk.builtin.str(ggbApi.getCaption(this.$ggbLabel));
    },
    $set(this: SkGgbObject, pyCaption: SkObject) {
      throwIfNotString(pyCaption, "caption must be a string");
      ggbApi.setCaption(this.$ggbLabel, pyCaption.v);
      ggbApi.setLabelStyle(this.$ggbLabel, 3);
    },
  },
  _ggb_type: {
    $get(this: SkGgbObject) {
      return new Sk.builtin.str(ggbApi.getObjectType(this.$ggbLabel));
    },
  },
  _ggb_exists: {
    $get(this: SkGgbObject) {
      return new Sk.builtin.bool(ggbApi.exists(this.$ggbLabel));
    },
  },
});

type EveryElementIsGgbObjectOfType = (
  objs: Array<SkObject>,
  requiredType: string
) => objs is Array<SkGgbObject>;

// Type definition that extends the functionality of the basic Geogebra GgbApi
export type AugmentedGgbApi = {
  isGgbObject(obj: SkObject): obj is SkGgbObject;
  isGgbObjectOfType(obj: SkObject, requiredType: string): obj is SkGgbObject;
  ggbType(objOrLabel: SkGgbObject | string): string;
  throwIfNotGgbObject(
    obj: SkObject,
    objName: string
  ): asserts obj is SkGgbObject;
  throwIfNotGgbObjectOfType(
    obj: SkObject,
    requiredType: string,
    objName: string
  ): asserts obj is SkGgbObject;
  throwIfNotPyOrGgbNumber(
    obj: SkObject,
    objName: string
  ): asserts obj is SkInt | SkFloat | SkGgbObject;
  everyElementIsGgbObject: typeof everyElementIsGgbObject;
  everyElementIsGgbObjectOfType: EveryElementIsGgbObjectOfType;
  isPythonOrGgbNumber(obj: SkObject): boolean;
  numberValueOrLabel(obj: SkObject): string;
  wrapExistingGgbObject(label: string): SkGgbObject;
  sharedGetSets: SharedGetSets;
  freeCopyMethodsSlice: MethodDescriptorsSlice;
  deleteMethodsSlice: MethodDescriptorsSlice;
  withPropertiesMethodsSlice: MethodDescriptorsSlice;
  // setSize(width: number, height: number): void; // Add setSize definition
  evalCmd(cmd: string): string; // executes a Geogebra command and return the label of resulting object
  evalCmdMultiple(cmd: string): string[]; // added custom utilities
  getValue(label: string): number;
  setValue(label: string, value: number): void;
  getXcoord(label: string): number;
  getYcoord(label: string): number;
  setCoords(label: string, x: number, y: number): void;
  deleteObject(label: string): void;
  registerObjectUpdateListener(label: string, fun: () => void): void;
  sharedOpSlots: OperationSlots;
};

/** Construct and return an "augmented GeoGebra API" object, which adds
 * various utility functions and constants to the native GeoGebra API.
 * */
export const augmentedGgbApi = (ggbApi: GgbApi): AugmentedGgbApi => {
  // Can we make these variadic?
  function fixGgbArg_1<ArgT, ResultT>(
    f: (ggbApi: GgbApi, arg: ArgT) => ResultT
  ) {
    return (arg: ArgT) => f(ggbApi, arg);
  }
  function fixGgbArg_2<Arg1T, Arg2T, ResultT>(
    f: (ggbApi: GgbApi, arg1: Arg1T, arg2: Arg2T) => ResultT
  ) {
    return (arg1: Arg1T, arg2: Arg2T) => f(ggbApi, arg1, arg2);
  }
  function fixGgbArg_3<Arg1T, Arg2T, Arg3T, ResultT>(
    f: (ggbApi: GgbApi, arg1: Arg1T, arg2: Arg2T, arg3: Arg3T) => ResultT
  ) {
    return (arg1: Arg1T, arg2: Arg2T, arg3: Arg3T) =>
      f(ggbApi, arg1, arg2, arg3);
  }
  // const setSize = (width: number, height: number): void => ggbApi.setSize(width, height); //
  const evalCmd = (cmd: string): string => ggbApi.evalCommandGetLabels(cmd); // Internally calls ggbApi.evalCommandGetLabels(cmd)
  const evalCmdMultipleWrapper = (cmd: string): string[] => evalCmdMultiple(ggbApi, cmd); /////////////////////////////////////// calls the custom utility function
  const getValue = (label: string): any => ggbApi.getValue(label); // Calls ggbApi.getValue(label).
  const setValue = (label: string, value: number): void =>
    ggbApi.setValue(label, value);
  const setCoords = (label: string, x: number, y: number): void =>
    ggbApi.setCoords(label, x, y);
  const getXcoord = (label: string): number => ggbApi.getXcoord(label);
  const getYcoord = (label: string): number => ggbApi.getYcoord(label);
  const deleteObject = (label: string): void => ggbApi.deleteObject(label);
  const registerObjectUpdateListener = (label: string, fun: () => void): void =>
    ggbApi.registerObjectUpdateListener(label, fun);

  // TypeScript can't (yet?) infer type predicate return values.
  type IsGgbObjectPredicate = (x: SkObject) => x is SkGgbObject;

  // TODO: Review usage of isInstance() vs throwIfNotGgbObjectOfType().

  // when we import this AugmentedGgbApi(from shared.ts) , we gain access to all the functions listed in the api object
  const api: AugmentedGgbApi = {
    isGgbObject: fixGgbArg_1(isGgbObject) as IsGgbObjectPredicate,
    isGgbObjectOfType: fixGgbArg_2(isGgbObject) as IsGgbObjectPredicate,
    ggbType: fixGgbArg_1(_ggbType),
    throwIfNotGgbObject,
    throwIfNotGgbObjectOfType: fixGgbArg_3(throwIfNotGgbObjectOfType),
    throwIfNotPyOrGgbNumber: fixGgbArg_2(throwIfNotPyOrGgbNumber),
    everyElementIsGgbObject,
    everyElementIsGgbObjectOfType: fixGgbArg_2(
      _everyElementIsGgbObjectOfType
    ) as EveryElementIsGgbObjectOfType,
    isPythonOrGgbNumber: fixGgbArg_1(isPythonOrGgbNumber),
    numberValueOrLabel: fixGgbArg_1(numberValueOrLabel),
    wrapExistingGgbObject: fixGgbArg_1(wrapExistingGgbObject),
    sharedGetSets: sharedGetSets(ggbApi),
    freeCopyMethodsSlice: freeCopyMethodsSlice(ggbApi),
    deleteMethodsSlice: deleteMethodsSlice(ggbApi),
    withPropertiesMethodsSlice,
    // setSize,//
    evalCmd,
    evalCmdMultiple: evalCmdMultipleWrapper, //
    getValue,
    setValue,
    getXcoord,
    getYcoord,
    setCoords,
    deleteObject,
    registerObjectUpdateListener,
    sharedOpSlots: operationSlots(ggbApi),
  };

  return api; // The resulting api object includes 1. Core Geogebra API methods 2. Custom utilities (e.g. wrapExistingGgbObject, everyElementIsGgbObjectOfType)
};
