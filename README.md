# Python-driven GeoGebra

A webapp to allow people to interact with GeoGebra via Python.

[See it in action here.](https://www.geogebra.org/python/)

# Updates
1. added angle.ts
2. modify intersect.ts, allowing PyGGB to calculate intersection between 2 object under 4 different situations (see below):
![demonstration of intersect() ](https://github.com/user-attachments/assets/0a5c4458-7d06-489d-9c59-d7ede760d5b1)
If the function return (Nan, Nan), it indicates either no intersecting point/ infinite intersecting points

# Added Functions for Area, Arc, and Mid Points 10/01/2024 Kelvin
Done:
- Call by Area(Point, ..., Point) and Area(Polygon)
- Call by Arc(Circle/Ellipse, Point, Point)
- Call by MidPoint(Segment/Conic/Interval/Quadric) and MidPoint(Point, Point)

In progress
- Aeccess to retuen value
- Call by Area(Conic);no functions for Conic currently, it's optional.
- Call by Arc(Circle/Ellipse, Parameter, Parameter); optional as well.
- Testing on MidPoint(Conic/Interval/Quadric)
