define( [
    'osgUtil/Composer',
    'osgUtil/ParameterVisitor',
    'osgUtil/Oculus',
    'osgUtil/WebVR',
    'osgUtil/IntersectionVisitor',
    'osgUtil/LineSegmentIntersector',
    'osgUtil/PolytopeIntersector',
    'osgUtil/DisplayNodeGraphVisitor',
    'osgUtil/DisplayNormalVisitor',
    'osgUtil/DisplayGeometryVisitor',
    'osgUtil/NodeGizmo'
], function ( Composer, ParameterVisitor, Oculus, WebVR, IntersectionVisitor, LineSegmentIntersector, PolytopeIntersector, DisplayNodeGraphVisitor, DisplayNormalVisitor, DisplayGeometryVisitor, NodeGizmo ) {

    'use strict';

    var osgUtil = {};

    osgUtil.Composer = Composer;
    osgUtil.ParameterVisitor = ParameterVisitor;
    osgUtil.Oculus = Oculus;
    osgUtil.WebVR = WebVR;
    osgUtil.IntersectionVisitor = IntersectionVisitor;
    osgUtil.PolytopeIntersector = PolytopeIntersector;
    osgUtil.LineSegmentIntersector = LineSegmentIntersector;
    osgUtil.DisplayNodeGraphVisitor = DisplayNodeGraphVisitor;
    osgUtil.DisplayNormalVisitor = DisplayNormalVisitor;
    osgUtil.DisplayGeometryVisitor = DisplayGeometryVisitor;
    osgUtil.NodeGizmo = NodeGizmo;
    return osgUtil;
} );
