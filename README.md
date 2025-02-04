# Python-driven GeoGebra

A webapp to allow people to interact with GeoGebra via Python.

## Vision
We aim to bridge the gap between Python programming and geometric visualization, working towards building an AI agent capable of solving geometric problems. This project represents the first step in that direction.

## About
This project is forked from [bennorth/pyggb](https://github.com/bennorth/pyggb). We have been working closely with the original author and Professor Lingpeng Kong from The University of Hong Kong (HKU) to extend its capabilities.

## Try it out
- Original webapp: [See it in action here](https://www.geogebra.org/python/)
- For webapp with latest updates: Clone this project and read `developing-README.md` to deploy it on your local machine

# Updates
1. added angle.ts
2. modify intersect.ts, allowing PyGGB to calculate intersection between 2 object under 4 different situations (see below):
![demonstration of intersect() ](https://github.com/user-attachments/assets/0a5c4458-7d06-489d-9c59-d7ede760d5b1)
If the function return (Nan, Nan), it indicates either no intersecting point/ infinite intersecting points
3. added AreConcurrent function, also modified line.ts function to accept user-defined input
5. AreConcyclic, AreCongruent, AreEqual, areParallel, areCollinear, arePerpendicular done (17/1)
6. Update Centroid(Polygon) and Incircle(Point, Point, Point) so that they return the x,y coordinate of centroid and incentre respectively, create circumcentre.ts and orthocentre.ts, and perpendicularline.ts (18/1)
   
## Added Functions for Area, Arc, and Mid Points - 10/01/2025 - Kelvin
Done:
- Call by Area(Point, ..., Point) and Area(Polygon)
- Call by Arc(Circle/Ellipse, Point, Point)
- Call by MidPoint(Segment/Conic/Interval/Quadric) and MidPoint(Point, Point)

In progress
- Aeccess to retuen value
- Call by Area(Conic);no functions for Conic currently, it's optional.
- Call by Arc(Circle/Ellipse, Parameter, Parameter); optional as well.
- Testing on MidPoint(Conic/Interval/Quadric)

## Added Functions for Perpendicular Bisector, Tangent, Circumference, Perimeter, and RigidPolygon - 13/01/2025 - Kelvin
Done:
- Return value of area
- Call by PerpendicularBisector(Segment), PerpendicularBisector(Point, Point), and PerpendicularBisector(Point, Point, Direction) and all tested
- Call by Tangent(Point, Parabola/Circle) and Tangent(Circle, Circle) and all tested
- Call by Circumference(Circle/Conic) and Perimeter(Circle/Polygon/Conic)
- Call by RigidPolygon(Polygon), RigidPolygon(Polygon, Offset x, Offset y), and RigidPolygon(Point, ..., Point) and all tested

Note:
- All applications involving Conic are not tested.

## Added Functions for Centroid and Incircle - 15/01/2025 - Kelvin
Done:
- Call by Centroid(Polygon) and tested
- Call by Incircle(Point, Point, Point) tested

Note:
- Made a temporary change in angle which return value of degree of the angle. However, it makes angle invisible.
