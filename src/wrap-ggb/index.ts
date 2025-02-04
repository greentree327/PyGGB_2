// Add these
import { register as registerAngleBisector } from "./wrappings/angle-bisector";
import { register as registerArea } from "./wrappings/area";
import { register as registerArc } from "./wrappings/arc";
import { register as registerMidPoint } from "./wrappings/mid-point";
import { register as registerPerpendicularBisector } from "./wrappings/perpendicular-bisector";
import { register as registerTangent } from "./wrappings/tangent";
import { register as registerCircumference } from "./wrappings/circumference";
import { register as registerPerimeter } from "./wrappings/perimeter";
import { register as registerRigidPolygon } from "./wrappings/rigid-polygon";
import { register as registerCentroid  } from "./wrappings/centroid";
import { register as registerIncircle  } from "./wrappings/incircle";
import { register as registerCircumcentre  } from "./wrappings/circumcentre"; //
import { register as registerOrthocentre  } from "./wrappings/orthocentre"; //

import { AppApi } from "../shared/appApi";
import { register as registerAreCollinear } from "./wrappings/arecollinear";// AreCollinear
import { register as registerAreConcurrent } from "./wrappings/areconcurrent";// AreConcurrent
import { register as registerAreConcyclic } from "./wrappings/areconcyclic";// AreConcyclic
import { register as registerAreCongruent } from "./wrappings/arecongruent";// AreCongruent
import { register as registerAreEqual } from "./wrappings/areequal";// AreEqual
import { register as registerAreParallel } from "./wrappings/areparallel";// AreParallel
import { register as registerArePerpendicular } from "./wrappings/areperpendicular";// ArePerpendicular
import { register as registerPerpendicularLine } from "./wrappings/perpendicularline";// PerpendicularLine
import { register as registerPoint } from "./wrappings/point";
import { register as registerAngle } from "./wrappings/angle";
import { register as registerCircle } from "./wrappings/circle";
import { register as registerEllipse } from "./wrappings/ellipse";
import { register as registerLine } from "./wrappings/line";
import { register as registerNumber } from "./wrappings/number";
import { register as registerBoolean } from "./wrappings/boolean";
import { register as registerVector } from "./wrappings/vector";
import { register as registerSegment } from "./wrappings/segment";
import { register as registerParabola } from "./wrappings/parabola";
import { register as registerPolygon } from "./wrappings/polygon";
import { register as registerSlider } from "./wrappings/slider";
import { register as registerRotate } from "./wrappings/rotate";
import { register as registerFunction } from "./wrappings/function"; //
import { register as registerIf } from "./wrappings/if";
import { register as registerDistance } from "./wrappings/distance";
import { register as registerIntersect } from "./wrappings/intersect";
import { register as registerZoom } from "./wrappings/zoom";
import { register as registerNumberOfObjects } from "./wrappings/number-of-objects";
import { register as registerPointIn } from "./wrappings/pointin"; //
import { register as registerClearConsole } from "./app-ui/clear-console";

import { register as registerOnTemperatureReport } from "./web-hid/on-temperature-report";

import { register as registerInterruptibleSleep } from "./interruptible-sleep";
import { register as registerMathOperations } from "./wrappings/mathoperations"; //
import { register as registerGetBase64 } from "./getBase64";

import { SkulptApi } from "../shared/vendor-types/skulptapi";
declare var Sk: SkulptApi;

(globalThis as any).$skulptGgbModule = (appApi: AppApi) => {
  // For ease of debugging:
  (window as any).ggbApplet = appApi.ggb;

  // This object gets built up in stages, and each register() function
  // expects a different type, so fudge it.  Perhaps there's a better
  // way to do this?
  let mod = { __name__: new Sk.builtin.str("ggb") } as any;

  // Add these
  registerAngleBisector(mod, appApi);
  registerArea(mod, appApi);
  registerArc(mod, appApi);
  registerMidPoint(mod, appApi);
  
  registerPerpendicularBisector(mod, appApi);
  registerTangent(mod, appApi);
  registerCircumference(mod, appApi)
  registerPerimeter(mod, appApi)
  registerRigidPolygon(mod, appApi)
  
  registerCentroid(mod, appApi);
  registerIncircle(mod, appApi);
  registerCircumcentre(mod, appApi);
  registerOrthocentre(mod, appApi);



  registerAngle(mod, appApi); // first registered geogebra module
  registerAreCollinear(mod, appApi); //
  registerAreConcurrent(mod, appApi); //
  registerAreConcyclic(mod, appApi); //
  registerAreCongruent(mod,appApi); //
  registerAreEqual(mod,appApi); //
  registerAreParallel(mod, appApi); //
  registerArePerpendicular(mod, appApi); //
  registerPerpendicularLine(mod, appApi); //

  registerPoint(mod, appApi);
  registerAngle(mod, appApi);
  registerCircle(mod, appApi);
  registerEllipse(mod, appApi);
  registerLine(mod, appApi);
  registerNumber(mod, appApi);
  registerBoolean(mod, appApi);
  registerVector(mod, appApi);
  registerSegment(mod, appApi);
  registerParabola(mod, appApi);
  registerPolygon(mod, appApi);
  registerSlider(mod, appApi);
  registerRotate(mod, appApi);
  registerFunction(mod, appApi); //
  registerIf(mod, appApi);
  registerDistance(mod, appApi);
  registerIntersect(mod, appApi);
  registerZoom(mod, appApi);
  registerNumberOfObjects(mod, appApi);
  registerPointIn(mod, appApi); //

  registerClearConsole(mod, appApi);

  registerOnTemperatureReport(mod, appApi);

  registerInterruptibleSleep(mod, appApi);
  registerMathOperations(mod, appApi); //
  registerGetBase64(mod, appApi);

  return mod;
};
