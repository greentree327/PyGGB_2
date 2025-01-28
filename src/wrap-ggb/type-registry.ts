import { GgbApi } from "../shared/vendor-types/ggbapi";
import { WrapExistingCtorSpec, SkGgbObject } from "./shared";
import { SkObject, SkString, SkulptApi } from "../shared/vendor-types/skulptapi";

declare var Sk: SkulptApi;

type ConstructibleFromWrapExistingSpec = {
  new (spec: WrapExistingCtorSpec): SkGgbObject;
};

let registry = new Map<string, ConstructibleFromWrapExistingSpec>();

/** Register the given `cls` as being the Skulpt/Python wrapper class
 * for GeoGebra objects whose type has the given `typeName`. */
export const registerObjectType = (
  typeName: string,
  cls: ConstructibleFromWrapExistingSpec
): void => {
  registry.set(typeName, cls);
};

/** Create and return a new Skulpt/Python object wrapping the GeoGebra
 * object with the given `objectLabel`. */
export const wrapExistingGgbObject = (
  ggbApi: GgbApi,
  objectLabel: string // this is the label(e.g. 'E') of the Geogebra Object that you want to wrap
): SkGgbObject => {   // return a value of type SkGgbObject
  const objectType = ggbApi.getObjectType(objectLabel); // An internal command from ggbApi, retrieves the Object type given the objectLabel
  // Debugging: Log the object type
  // console.log(`Object Type for ${objectLabel}: ${objectType}`);

  // Debugging: Log the registry contents
  // console.log(Array.from(registry.entries()));
  // console.log("Registered 'function':", registry.get("function"));

  const maybeCls = registry.get(objectType);            // get the appropoiate wrapper class(maybeCls) for the Object type, e.g. If Object type = point, their corresponding wrapper class will be Skpoint
  if (maybeCls == null)                                 // registry does not have a wrapper class for Object type null
    throw new Sk.builtin.RuntimeError(
      `unknown object-type "${objectType}"` +
        ` when trying to wrap ggb object "${objectLabel}"`
    );

  return new maybeCls({ kind: "wrap-existing", label: objectLabel }); // return new SkPoint({ kind: "wrap-existing", label: "PointA" });
};
