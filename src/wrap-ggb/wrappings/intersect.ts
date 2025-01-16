import { AppApi } from "../../shared/appApi";
import { assembledCommand, augmentedGgbApi,withPropertiesFromNameValuePairs,
  WrapExistingCtorSpec,
  SkGgbObject,
  setGgbLabelFromArgs} from "../shared";
import { SkObject, SkulptApi} from "../../shared/vendor-types/skulptapi";
import { registerObjectType } from "../type-registry";
declare var Sk: SkulptApi;

// The right way to present Intersect() to Python is not obvious.  The
// native Ggb return value is a list/array, which we could wrap in a
// sequence-like object to Python.  This would have the advantage of
// letting the list of intersection points update as the intersecting
// objects move.  However, some Python operations on sequences e.g.,
// sorted(), return actual Python lists so at that point we'd lose the
// tie to the native Ggb array of intersections.  For v1, we settled on
// only supporting the Intersect(p, q, n) form of the Ggb function.

export const register = (mod: any, appApi: AppApi) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const fun = new Sk.builtin.func((...args) => {   // ...args: allow the function to accept any number of parameters, which are gathered into an array called args
    const badArgsError = new Sk.builtin.TypeError( // predefine badArgsError for later use
      "Intersect() arguments must be two GeoGebra objects, followed by python numbers or a Geogebra point object"
    );

    if (args.length < 2 || args.length > 4){
      throw new Sk.builtin.RuntimeError(
        `Intersect() arguments nust be bewteen 2-4`
      );
    }

    const [object1, object2, optionalArg1, optionalArg2] = args // array destructing, it assigns values from the args array to the specific variables in [], based on their position in the array 
      // if less than 4 arguments are passed into args (i.e. 3 arguments), then optionalArg2 will be undefined
    
    if (!ggb.isGgbObject(object1) || !ggb.isGgbObject(object2)) {
      throw badArgsError;
    }

    let ggbCmd; // currently undefined

    if (args.length === 2) {
      ggbCmd = assembledCommand("Intersect", [
        object1.$ggbLabel,
        object2.$ggbLabel
      ])
    } else if (args.length === 3) {
      // Intersect(A,B, <Index of intersecting point> or <Initial Point>)
      if (ggb.isPythonOrGgbNumber(optionalArg1)) {  // returns true if optionalArg is a python number or a Geogebra numeric object (e.g. 3, 5.7, x = 2)
        ggbCmd = assembledCommand("Intersect", [
          object1.$ggbLabel,
          object2.$ggbLabel,
          ggb.numberValueOrLabel(optionalArg1) // If optionalArg1 is Geogebra object, return its label; else, return the exponential form of the number
        ])
      } else if (ggb.isGgbObject(optionalArg1)) {  // returns a declaration that optionalArg1 can be treated as SkGgbObject in the subsequent code
          if (ggb.isGgbObject(optionalArg1), 'point') { // returns true if optionalArg1 is a point object in Geogebra
            ggbCmd = assembledCommand("Intersect", [
              object1.$ggbLabel,
              object2.$ggbLabel,
              optionalArg1.$ggbLabel,
            ])
          } else {
            throw badArgsError;
          }
        
      } else {
        throw badArgsError;
      }
    } else if (args.length === 4){
      // Intersect(A,B,x1,x2), find the intersecting point inside range(x1,x2)
      if (
          ggb.isPythonOrGgbNumber(optionalArg1) && 
          ggb.isPythonOrGgbNumber(optionalArg2)
      ) {
          // Convert GeoGebra-style exponential notation to a number, evaluate the expression, and format it to 15 significant digits.
          const startingX = parseFloat(eval(ggb.numberValueOrLabel(optionalArg1).replace(/\*10\^\(\+?(-?\d+)\)/g, "* Math.pow(10, $1)")).toPrecision(15)); 
          const endingX = parseFloat(eval(ggb.numberValueOrLabel(optionalArg2).replace(/\*10\^\(\+?(-?\d+)\)/g, "* Math.pow(10, $1)")).toPrecision(15));
            /*
            Regex breakdown:
            - / and /g: define the regex pattern, and enable the global search flag (g) to replace all atches in the string
            - \*: Matches the multiplication character (*)
            - 10\^: Matches the base 10 notation (10^)
            - \(: Match the open parathensis (
            - \+?: Matches an optional + sign
            - (-?\d+) :
              - -?: allows an optional - sign
              - \d: matches any digits; +: one or more; \d+: matches one or more digits
            - \): Match the close parathensis )

            Replacement string:
            - $1: Refers to the captured exponent from the regex match(i.e. the number inside (-?\d+))
            */
       
          // Step 1: Find all intersection points using Intersect(Object1, Object2)
          ggbCmd = assembledCommand("Intersect", [
            object1.$ggbLabel,
            object2.$ggbLabel,
          ]);
          // Evaluate the command to get all intersection points
          const label = ggb.evalCmdMultiple(ggbCmd);
          const filteredLabel = label.filter(item => item !== null && item !== 'null'); // remove both type null and string null in array, 

          // Step 2: Filter points based on the x-coordinate bounds
          const filteredPoints = filteredLabel.filter((filteredLabel) => {
            const xCoord = ggb.getXcoord(filteredLabel);
            return xCoord >= startingX && xCoord <= endingX;
          })
          
          // Check for empty results
          if (filteredPoints.length === 0) {
            const message = `No intersection points found within the x-interval [${startingX}, ${endingX}]`;
            return new Sk.builtin.str(message);
          }
          // Wrap and return the filtered points as a Python string
          if (Array.isArray(filteredPoints)) { // if the result is an array
            const result =  filteredPoints.map((item) => ggb.wrapExistingGgbObject(item)); // ok
            return new Sk.builtin.str(result.join(", ")) // ok
          } 
          else if (typeof filteredPoints === "string") {
            return new Sk.builtin.str(filteredPoints); // Return as a Python-compatible string
          } 
          else {
            throw new Error(`Unexpected return type: ${typeof filteredPoints}`);
          } 
      } else {
        throw badArgsError;
      }
      
    } else {
      throw badArgsError;
    }

    // It seems that always get a Point.  If there is no Nth
    // intersection, the Point has NaN coords.
    const label = ggb.evalCmdMultiple(ggbCmd); // returns an array
    const filteredLabel = label.filter(item => item !== null && item !== 'null'); // remove both type null and string null in array, 


    if (Array.isArray(filteredLabel)) { // if the result is an array
      const result =  filteredLabel.map((item) => ggb.wrapExistingGgbObject(item)); // ok
      return new Sk.builtin.str(result.join(", ")) // ok
    } 
    else if (typeof filteredLabel === "string") {
      return new Sk.builtin.str(filteredLabel); // Return as a Python-compatible string
    } 
    else {
      throw new Error(`Unexpected return type: ${typeof filteredLabel}`);
    }

    // TODO: Will we always get Points back?  Assert this?  Do we need to
    // distinguish between free and derived points?  What happens if when we
    // initially Intersect a Segment and a Polygon, they don't intersect, but
    // then I drag one end of the Segment such that it intersects the Polygon
    // twice.  The "Intersection" object does what?  Looks like it tracks one of
    // the intersection points.  Both intersections are shown on the
    // construction though.
    //
    // If you intersect two Segments which are collinear and overlap, you get
    // back a NaN,Nan point.
  });

  mod.Intersect = fun;
};