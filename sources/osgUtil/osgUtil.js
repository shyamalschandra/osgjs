define( [
    'osgUtil/Composer',
    'osgUtil/DisplayNormalVisitor',
    'osgUtil/DisplayGeometryVisitor',
    'osgUtil/LineSegmentIntersector',
    'osgUtil/IntersectionVisitor',
    'osgUtil/Oculus',
    'osgUtil/ParameterVisitor',
    'osgUtil/PolytopeIntersector',
    'osgUtil/PolytopePrimitiveIntersector',
    'osgUtil/TangentSpaceGenerator',
    'osgUtil/TriangleIntersector',
    'osgUtil/WebVR',

], function ( Composer, DisplayNormalVisitor, DisplayGeometryVisitor, LineSegmentIntersector, IntersectionVisitor, Oculus, ParameterVisitor, PolytopeIntersector, PolytopePrimitiveIntersector, TangentSpaceGenerator, TriangleIntersect, WebVR ) {

    'use strict';

    var osgUtil = {};

    osgUtil.Composer = Composer;
    osgUtil.DisplayNormalVisitor = DisplayNormalVisitor;
    osgUtil.DisplayGeometryVisitor = DisplayGeometryVisitor;
    osgUtil.LineSegmentIntersector = LineSegmentIntersector;
    osgUtil.IntersectionVisitor = IntersectionVisitor;
    osgUtil.Oculus = Oculus;
    osgUtil.ParameterVisitor = ParameterVisitor;
    osgUtil.PolytopeIntersector = PolytopeIntersector;
    osgUtil.PolytopePrimitiveIntersector = PolytopePrimitiveIntersector;
    osgUtil.TangentSpaceGenerator = TangentSpaceGenerator;
    osgUtil.TriangleIntersect = TriangleIntersect;
    osgUtil.WebVR = WebVR;
    return osgUtil;

} );
