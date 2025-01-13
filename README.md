# Python-driven GeoGebra

A webapp to allow people to interact with GeoGebra via Python.

[See it in action here.](https://www.geogebra.org/python/)

# Updates
1. added angle.ts
2. modify intersect.ts, allowing PyGGB to calculate intersection between 2 object under 4 different situations (see below):
![demonstration of intersect() ](https://github.com/user-attachments/assets/0a5c4458-7d06-489d-9c59-d7ede760d5b1)
If the function return (Nan, Nan), it indicates either no intersecting point/ infinite intersecting points
3. added AreConcurrent function, also modified line.ts function to accept user-defined input(see below)
4. ![modified line.ts function](https://github.com/user-attachments/assets/23e86299-e8f9-463e-a42d-333c200f9f16)
   
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
- Call by Circumference(Circle/Conic) and registerPerimeter(Circle/Polygon/Conic)
- Call by RigidPolygon(Polygon), RigidPolygon(Polygon, Offset x, Offset y), and RigidPolygon(Point, ..., Point) and all tested

Note:
- All applications involving Conic are not tested.
