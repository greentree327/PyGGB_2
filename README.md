# Python-driven GeoGebra

A webapp to allow people to interact with GeoGebra via Python.

[See it in action here.](https://www.geogebra.org/python/)

# Updates
1. added angle.ts
2. modify intersect.ts, allowing PyGGB to calculate intersection between 2 object under 4 different situations (see below):
![demonstration of intersect() ](https://github.com/user-attachments/assets/0a5c4458-7d06-489d-9c59-d7ede760d5b1)
If the function return (Nan, Nan), it indicates either no intersecting point/ infinite intersecting points

# Added Functions for Area 10/01/2024 Kelvin
Done:
- Call by Area(Point, ..., Point)
- Call by Area(Polygon)

In progress
- Aeccess to retuen value
- Call by Area(Conic);no functions for Conic currently, it's optional.
