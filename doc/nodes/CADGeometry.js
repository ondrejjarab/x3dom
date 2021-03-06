/** @namespace x3dom.nodeTypes */
/*
 * CADGeometry:
 * CADGeometry component of X3D extension to the
 * X3DOM JavaScript Library
 * http://x3dom.org
 *

 * Closely adapted from the code for the Grouping components in X3D as
 * implemented in X3DOM
 
 Dual licensed under the MIT and GPL.
 http://x3dom.org/download/dev/docs/html/license.html
 
 * Based on code originally provided by
 *  Philip Taylor: http://philip.html5.org
 
 * 19 Nov 2012  Vincent Marchetti:  vmarchetti@kshell.com
 * 25 May 2013  -- implemented QuadSet, IndexedQuadSet; based largely on the code
                for IndexedTriangleSet in Rendering.js
 */


// ### IndexedQuadSet ###
x3dom.registerNodeType(
    "IndexedQuadSet",
    "CADGeometry",
    defineClass(x3dom.nodeTypes.X3DComposedGeometryNode,
        
        /**
         * Constructor for IndexedQuadSet
         * @constructs x3dom.nodeTypes.IndexedQuadSet
         * @x3d x.x
         * @component CADGeometry
         * @status experimental
         * @extends x3dom.nodeTypes.X3DComposedGeometryNode
         * @param {Object} [ctx=null] - context object, containing initial settings like namespace
         */
        function (ctx) {
            x3dom.nodeTypes.IndexedQuadSet.superClass.call(this, ctx);


            /**
             *
             * @var {MFInt32} index
             * @memberof x3dom.nodeTypes.IndexedQuadSet
             * @initvalue []
             * @field x3dom
             * @instance
             */
            this.addField_MFInt32(ctx, 'index', []);
        
        },
        {
            nodeChanged: function()
            {
                /*
                This code largely taken from the IndexedTriangleSet code
                */
                var time0 = new Date().getTime();

                this.handleAttribs();

				var colPerVert = this._vf.colorPerVertex;
                var normPerVert = this._vf.normalPerVertex;

                var indexes = this._vf.index;

                var hasNormal = false, hasTexCoord = false, hasColor = false;
                var positions, normals, texCoords, colors;

                var coordNode = this._cf.coord.node;
                x3dom.debug.assert(coordNode);
                positions = coordNode._vf.point;

                var normalNode = this._cf.normal.node;
                if (normalNode) {
                    hasNormal = true;
                    normals = normalNode._vf.vector;
                }
                else {
                    hasNormal = false;
                }

                var texMode = "", numTexComponents = 2;
                var texCoordNode = this._cf.texCoord.node;
                if (x3dom.isa(texCoordNode, x3dom.nodeTypes.MultiTextureCoordinate)) {
                    if (texCoordNode._cf.texCoord.nodes.length)
                        texCoordNode = texCoordNode._cf.texCoord.nodes[0];
                }
                if (texCoordNode) {
                    if (texCoordNode._vf.point) {
                        hasTexCoord = true;
                        texCoords = texCoordNode._vf.point;

                        if (x3dom.isa(texCoordNode, x3dom.nodeTypes.TextureCoordinate3D)) {
                            numTexComponents = 3;
                        }
                    }
                    else if (texCoordNode._vf.mode) {
                        texMode = texCoordNode._vf.mode;
                    }
                }
                else {
                    hasTexCoord = false;
                }

                var numColComponents = 3;
                var colorNode = this._cf.color.node;
                if (colorNode) {
                    hasColor = true;
                    colors = colorNode._vf.color;

                    if (x3dom.isa(colorNode, x3dom.nodeTypes.ColorRGBA)) {
                        numColComponents = 4;
                    }
                }
                else {
                    hasColor = false;
                }

                this._mesh._indices[0] = [];
                this._mesh._positions[0] = [];
                this._mesh._normals[0] = [];
                this._mesh._texCoords[0] = [];
                this._mesh._colors[0] = [];

                var i, t, cnt, faceCnt, posMax;
                var p0, p1, p2, n0, n1, n2, t0, t1, t2, c0, c1, c2;

                // if positions array too short add degenerate triangle
                while (positions.length % 4 > 0) {
                    positions.push(positions.length-1);
                }
                posMax = positions.length;

                /*
                Note: A separate section setting the _mesh field members
                and starting with this test:
                if (!normPerVert || positions.length > x3dom.Utils.maxIndexableCoords)
                is in the IndexedTriangleSet code. It has been removed
                here until it's applicability to the QUadSet case can
                be evaluated

                NOTE: !normPerVert or creaseAngle == 0 means per-face normals
                      therefore, the original multi-index structure also can't
                      be retained since this means every face has other vertices
                      with other attribute properties.
                      A similar problem arises if we have more than 2^16 coordinates
                      since WebGL only supports 16-bit indices, why we have to split
                      the mesh here (which is most easiest achieved by using just the
                      same code path previously mentioned)
                */
                //if (true)
                {
					faceCnt = 0;
					for (i=0; i<indexes.length; i++)
					{
						if ((i > 0) && (i % 4 === 3 )) {                   
							faceCnt++;
							
							// then pushe the the 2nd triangle
							// of the quad on
							this._mesh._indices[0].push(indexes[i-3]);
							this._mesh._indices[0].push(indexes[i-1]);
							this._mesh._indices[0].push(indexes[i]);
                        }	
						else{
						    this._mesh._indices[0].push(indexes[i]);
						}
							
						if(!normPerVert && hasNormal) {
							this._mesh._normals[0].push(normals[faceCnt].x);
							this._mesh._normals[0].push(normals[faceCnt].y);
							this._mesh._normals[0].push(normals[faceCnt].z);
						}
						if(!colPerVert && hasColor) {								
							this._mesh._colors[0].push(colors[faceCnt].r);
							this._mesh._colors[0].push(colors[faceCnt].g);
							this._mesh._colors[0].push(colors[faceCnt].b);
							if (numColComponents === 4) {
								this._mesh._colors[0].push(colors[faceCnt].a);
							}   
						}  				
					}
               
                    this._mesh._positions[0] = positions.toGL();
                    
                    if (hasNormal) {
                        this._mesh._normals[0] = normals.toGL();
                    }
                    else {
                        this._mesh.calcNormals(normPerVert ? Math.PI : 0);
                    }
                    
                    if (hasTexCoord) {
                        this._mesh._texCoords[0] = texCoords.toGL();
                        this._mesh._numTexComponents = numTexComponents;
                    }
                    else {
                        this._mesh.calcTexCoords(texMode);
                    }
                    
                    if (hasColor && colPerVert) {
                        this._mesh._colors[0] = colors.toGL();
                        this._mesh._numColComponents = numColComponents;
                    }
                }

                this.invalidateVolume();
                this._mesh._numFaces = 0;
                this._mesh._numCoords = 0;
                for (i=0; i<this._mesh._indices.length; i++) {
                    this._mesh._numFaces += this._mesh._indices[i].length / 3;
                    this._mesh._numCoords += this._mesh._positions[i].length / 3;
                }

                var time1 = new Date().getTime() - time0;
                //x3dom.debug.logInfo("Mesh load time: " + time1 + " ms");
            },

            fieldChanged: function(fieldName)
            {
                var pnts = this._cf.coord.node._vf.point;
                
                if ( pnts.length > x3dom.Utils.maxIndexableCoords )  // are there other problematic cases?
                {
					// TODO; implement
                    x3dom.debug.logWarning("IndexedQuadSet: fieldChanged with " +
                                           "too many coordinates not yet implemented!");
                    return;
                }
                
                if (fieldName == "coord")
                {
                    this._mesh._positions[0] = pnts.toGL();
                    
                    // tells the mesh that its bbox requires update
                    this.invalidateVolume();

                    Array.forEach(this._parentNodes, function (node) {					
                        node._dirty.positions = true;
                        node.invalidateVolume();
                    });
                }
                else if (fieldName == "color")
                {                                      
					pnts = this._cf.color.node._vf.color;
						
					if (this._vf.colorPerVertex) { 
				
						this._mesh._colors[0] = pnts.toGL();	
							
					} else if (!this._vf.colorPerVertex) {
						
						var faceCnt = 0;
						var numColComponents = 3;	
                   		if (x3dom.isa(this._cf.color.node, x3dom.nodeTypes.ColorRGBA)) {
							numColComponents = 4;
						}
							
						this._mesh._colors[0] = [];
							
						var indexes = this._vf.index;
						for (i=0; i < indexes.length; ++i)
						{
							if ((i > 0) && (i % 3 === 0 )) {                   
								faceCnt++;							
							}	
								
							this._mesh._colors[0].push(pnts[faceCnt].r);
							this._mesh._colors[0].push(pnts[faceCnt].g);
							this._mesh._colors[0].push(pnts[faceCnt].b);
							if (numColComponents === 4) {
								this._mesh._colors[0].push(pnts[faceCnt].a);
							}  
						}
					}
					Array.forEach(this._parentNodes, function (node) {
						node._dirty.colors = true;
					});
                }
				else if (fieldName == "normal")
                {                 
					pnts = this._cf.normal.node._vf.vector;
						
					if (this._vf.normalPerVertex) { 
						
						this._mesh._normals[0] = pnts.toGL();
							
					} else if (!this._vf.normalPerVertex) {
							
						var indexes = this._vf.index;
						this._mesh._normals[0] = [];
						
						var faceCnt = 0;
						for (i=0; i < indexes.length; ++i)
						{
							if ((i > 0) && (i % 3 === 0 )) {                   
								faceCnt++;							
							}	
							
							this._mesh._normals[0].push(pnts[faceCnt].x);
							this._mesh._normals[0].push(pnts[faceCnt].y);
							this._mesh._normals[0].push(pnts[faceCnt].z);	
						}
					}

					Array.forEach(this._parentNodes, function (node) {
						 node._dirty.normals = true;
					});
                }
				else if (fieldName == "texCoord")
                {
                    var texCoordNode = this._cf.texCoord.node;
                    if (x3dom.isa(texCoordNode, x3dom.nodeTypes.MultiTextureCoordinate)) {
                        if (texCoordNode._cf.texCoord.nodes.length)
                            texCoordNode = texCoordNode._cf.texCoord.nodes[0];
                    }
                    pnts = texCoordNode._vf.point;
                    
                    this._mesh._texCoords[0] = pnts.toGL();
                    
                    Array.forEach(this._parentNodes, function (node) {
                        node._dirty.texcoords = true;
                    });
                }
            }
        }
    )
);

// ### QuadSet ###
x3dom.registerNodeType(
    "QuadSet",
    "CADGeometry",
    defineClass(x3dom.nodeTypes.X3DComposedGeometryNode,
        
        /**
         * Constructor for QuadSet
         * @constructs x3dom.nodeTypes.QuadSet
         * @x3d x.x
         * @component CADGeometry
         * @status experimental
         * @extends x3dom.nodeTypes.X3DComposedGeometryNode
         * @param {Object} [ctx=null] - context object, containing initial settings like namespace
         */
        function (ctx) {
            x3dom.nodeTypes.QuadSet.superClass.call(this, ctx);
        
        },
        {
            nodeChanged: function()
            {
                /*
                This code largely taken from the IndexedTriangleSet code
                */
                var time0 = new Date().getTime();

                this.handleAttribs();

				var colPerVert = this._vf.colorPerVertex;
                var normPerVert = this._vf.normalPerVertex;

                var hasNormal = false, hasTexCoord = false, hasColor = false;
                var positions, normals, texCoords, colors;

                var coordNode = this._cf.coord.node;
                x3dom.debug.assert(coordNode);
                positions = coordNode._vf.point;

                var normalNode = this._cf.normal.node;
                if (normalNode) {
                    hasNormal = true;
                    normals = normalNode._vf.vector;
                }
                else {
                    hasNormal = false;
                }

                var texMode = "", numTexComponents = 2;
                var texCoordNode = this._cf.texCoord.node;
                if (x3dom.isa(texCoordNode, x3dom.nodeTypes.MultiTextureCoordinate)) {
                    if (texCoordNode._cf.texCoord.nodes.length)
                        texCoordNode = texCoordNode._cf.texCoord.nodes[0];
                }
                if (texCoordNode) {
                    if (texCoordNode._vf.point) {
                        hasTexCoord = true;
                        texCoords = texCoordNode._vf.point;

                        if (x3dom.isa(texCoordNode, x3dom.nodeTypes.TextureCoordinate3D)) {
                            numTexComponents = 3;
                        }
                    }
                    else if (texCoordNode._vf.mode) {
                        texMode = texCoordNode._vf.mode;
                    }
                }
                else {
                    hasTexCoord = false;
                }

                var numColComponents = 3;
                var colorNode = this._cf.color.node;
                if (colorNode) {
                    hasColor = true;
                    colors = colorNode._vf.color;

                    if (x3dom.isa(colorNode, x3dom.nodeTypes.ColorRGBA)) {
                        numColComponents = 4;
                    }
                }
                else {
                    hasColor = false;
                }

                this._mesh._indices[0] = [];
                this._mesh._positions[0] = [];
                this._mesh._normals[0] = [];
                this._mesh._texCoords[0] = [];
                this._mesh._colors[0] = [];

                var i, t, cnt, faceCnt, posMax;
                var p0, p1, p2, n0, n1, n2, t0, t1, t2, c0, c1, c2;

                // if positions array too short add degenerate triangle
                while (positions.length % 4 > 0) {
                    positions.push(positions.length-1);
                }
                posMax = positions.length;

                /*
                Note: A separate section setting the _mesh field members
                and starting with this test:
                if (!normPerVert || positions.length > x3dom.Utils.maxIndexableCoords)
                is in the IndexedTriangleSet code. It has been removed
                here until it's applicability to the QUadSet case can
                be evaluated
                */
                if (1)
                {
					faceCnt = 0;
					for (i=0; i<positions.length; i++)
					{
						if ((i > 0) && (i % 4 === 3 )) {                   
							faceCnt++;
							
							// then pushe the the 2nd triangle
							// of the quad on
							this._mesh._indices[0].push(i-3);
							this._mesh._indices[0].push(i-1);
							this._mesh._indices[0].push(i);
                        }	
						else{
						    this._mesh._indices[0].push(i);
						}
							
						if(!normPerVert && hasNormal) {
							this._mesh._normals[0].push(normals[faceCnt].x);
							this._mesh._normals[0].push(normals[faceCnt].y);
							this._mesh._normals[0].push(normals[faceCnt].z);
						}
						if(!colPerVert && hasColor) {								
							this._mesh._colors[0].push(colors[faceCnt].r);
							this._mesh._colors[0].push(colors[faceCnt].g);
							this._mesh._colors[0].push(colors[faceCnt].b);
							if (numColComponents === 4) {
								this._mesh._colors[0].push(colors[faceCnt].a);
							}   
						}  				
					}
               
                    this._mesh._positions[0] = positions.toGL();
                    
                    if (hasNormal) {
                        this._mesh._normals[0] = normals.toGL();
                    }
                    else {
                        this._mesh.calcNormals(normPerVert ? Math.PI : 0);
                    }
                    
                    if (hasTexCoord) {
                        this._mesh._texCoords[0] = texCoords.toGL();
                        this._mesh._numTexComponents = numTexComponents;
                    }
                    else {
                        this._mesh.calcTexCoords(texMode);
                    }
                    
                    if (hasColor && colPerVert) {
                        this._mesh._colors[0] = colors.toGL();
                        this._mesh._numColComponents = numColComponents;
                    }
                }

                this.invalidateVolume();
                this._mesh._numFaces = 0;
                this._mesh._numCoords = 0;
                for (i=0; i<this._mesh._indices.length; i++) {
                    this._mesh._numFaces += this._mesh._indices[i].length / 3;
                    this._mesh._numCoords += this._mesh._positions[i].length / 3;
                }

                var time1 = new Date().getTime() - time0;
                //x3dom.debug.logInfo("Mesh load time: " + time1 + " ms");
            },

            fieldChanged: function(fieldName)
            {
                var pnts = this._cf.coord.node._vf.point;
                
                if ( pnts.length > x3dom.Utils.maxIndexableCoords )  // are there other problematic cases?
                {
					// TODO; implement
                    x3dom.debug.logWarning("QuadSet: fieldChanged with " + 
                                           "too many coordinates not yet implemented!");
                    return;
                }
                
                if (fieldName == "coord")
                {
                    this._mesh._positions[0] = pnts.toGL();
                    
                    // tells the mesh that its bbox requires update
                    this.invalidateVolume();

                    Array.forEach(this._parentNodes, function (node) {					
                        node._dirty.positions = true;
                        node.invalidateVolume();
                    });
                }
                else if (fieldName == "color")
                {                                      
					pnts = this._cf.color.node._vf.color;
						
					if (this._vf.colorPerVertex) { 
				
						this._mesh._colors[0] = pnts.toGL();	
							
					} else if (!this._vf.colorPerVertex) {
						
						var faceCnt = 0;
						var numColComponents = 3;	
                   		if (x3dom.isa(this._cf.color.node, x3dom.nodeTypes.ColorRGBA)) {
							numColComponents = 4;
						}
							
						this._mesh._colors[0] = [];
							
						var indexes = this._vf.index;
						for (i=0; i < indexes.length; ++i)
						{
							if ((i > 0) && (i % 3 === 0 )) {                   
								faceCnt++;							
							}	
								
							this._mesh._colors[0].push(pnts[faceCnt].r);
							this._mesh._colors[0].push(pnts[faceCnt].g);
							this._mesh._colors[0].push(pnts[faceCnt].b);
							if (numColComponents === 4) {
								this._mesh._colors[0].push(pnts[faceCnt].a);
							}  
						}
					}
					Array.forEach(this._parentNodes, function (node) {
						node._dirty.colors = true;
					});
                }
				else if (fieldName == "normal")
                {                 
					pnts = this._cf.normal.node._vf.vector;
						
					if (this._vf.normalPerVertex) { 
						
						this._mesh._normals[0] = pnts.toGL();
							
					} else if (!this._vf.normalPerVertex) {
							
						var indexes = this._vf.index;
						this._mesh._normals[0] = [];
						
						var faceCnt = 0;
						for (i=0; i < indexes.length; ++i)
						{
							if ((i > 0) && (i % 3 === 0 )) {                   
								faceCnt++;							
							}	
							
							this._mesh._normals[0].push(pnts[faceCnt].x);
							this._mesh._normals[0].push(pnts[faceCnt].y);
							this._mesh._normals[0].push(pnts[faceCnt].z);	
						}
					}

					Array.forEach(this._parentNodes, function (node) {
						 node._dirty.normals = true;
					});
                }
				else if (fieldName == "texCoord")
                {
                    var texCoordNode = this._cf.texCoord.node;
                    if (x3dom.isa(texCoordNode, x3dom.nodeTypes.MultiTextureCoordinate)) {
                        if (texCoordNode._cf.texCoord.nodes.length)
                            texCoordNode = texCoordNode._cf.texCoord.nodes[0];
                    }
                    pnts = texCoordNode._vf.point;
                    
                    this._mesh._texCoords[0] = pnts.toGL();
                    
                    Array.forEach(this._parentNodes, function (node) {
                        node._dirty.texcoords = true;
                    });
                }
            }
        }
    )
);


// ### CADLayer ###
x3dom.registerNodeType(
    "CADLayer",
    "CADGeometry",
    defineClass(x3dom.nodeTypes.X3DGroupingNode,
        
        /**
         * Constructor for CADLayer
         * @constructs x3dom.nodeTypes.CADLayer
         * @x3d x.x
         * @component CADGeometry
         * @status experimental
         * @extends x3dom.nodeTypes.X3DGroupingNode
         * @param {Object} [ctx=null] - context object, containing initial settings like namespace
         */
        function (ctx) {
            x3dom.nodeTypes.CADLayer.superClass.call(this, ctx);


            /**
             *
             * @var {SFString} name
             * @memberof x3dom.nodeTypes.CADLayer
             * @initvalue ""
             * @field x3dom
             * @instance
             */
            this.addField_SFString(ctx,'name', "");
            // to be implemented: the 'visible' field
            // there already is a 'render' field defined in base class
            // which basically defines visibility...
            // NOTE: bbox stuff also already defined in a base class!
        
        }
    )
);

// ### CADAssembly ###
x3dom.registerNodeType(
    "CADAssembly",
    "CADGeometry",
    defineClass(x3dom.nodeTypes.X3DGroupingNode,
        
        /**
         * Constructor for CADAssembly
         * @constructs x3dom.nodeTypes.CADAssembly
         * @x3d x.x
         * @component CADGeometry
         * @status experimental
         * @extends x3dom.nodeTypes.X3DGroupingNode
         * @param {Object} [ctx=null] - context object, containing initial settings like namespace
         */
        function (ctx) {
            x3dom.nodeTypes.CADAssembly.superClass.call(this, ctx);


            /**
             *
             * @var {SFString} name
             * @memberof x3dom.nodeTypes.CADAssembly
             * @initvalue ""
             * @field x3dom
             * @instance
             */
            this.addField_SFString(ctx, 'name', "");
        
        }
    )
);

// ### CADPart ###
// According to the CADGeometry specification,
// the CADPart node has transformation fields identical to 
// those used in the Transform node, therefore just inherit it
x3dom.registerNodeType(
    "CADPart",
    "CADGeometry",
    defineClass(x3dom.nodeTypes.Transform,
        
        /**
         * Constructor for CADPart
         * @constructs x3dom.nodeTypes.CADPart
         * @x3d x.x
         * @component CADGeometry
         * @status experimental
         * @extends x3dom.nodeTypes.Transform
         * @param {Object} [ctx=null] - context object, containing initial settings like namespace
         */
        function (ctx) {
            x3dom.nodeTypes.CADPart.superClass.call(this, ctx);


            /**
             *
             * @var {SFString} name
             * @memberof x3dom.nodeTypes.CADPart
             * @initvalue ""
             * @field x3dom
             * @instance
             */
            this.addField_SFString(ctx, 'name', "");
        
        }
    )
);

// ### CADFace ###
x3dom.registerNodeType(
    "CADFace",
    "CADGeometry",
    defineClass(x3dom.nodeTypes.X3DGroupingNode,
        
        /**
         * Constructor for CADFace
         * @constructs x3dom.nodeTypes.CADFace
         * @x3d x.x
         * @component CADGeometry
         * @status experimental
         * @extends x3dom.nodeTypes.X3DGroupingNode
         * @param {Object} [ctx=null] - context object, containing initial settings like namespace
         */
        function (ctx) {
            x3dom.nodeTypes.CADFace.superClass.call(this, ctx);


            /**
             *
             * @var {SFString} name
             * @memberof x3dom.nodeTypes.CADFace
             * @initvalue ""
             * @field x3dom
             * @instance
             */
            this.addField_SFString(ctx, 'name', "");

            /**
             *
             * @var {SFNode} shape
             * @memberof x3dom.nodeTypes.CADFace
             * @initvalue x3dom.nodeTypes.X3DShapeNode
             * @field x3dom
             * @instance
             */
            this.addField_SFNode('shape', x3dom.nodeTypes.X3DShapeNode);
        
        },
        {
            getVolume: function()
            {
                var vol = this._graph.volume;

                if (!this.volumeValid() && this._vf.render)
                {
                    var child = this._cf.shape.node;
                    var childVol = (child && child._vf.render === true) ? child.getVolume() : null;

                    if (childVol && childVol.isValid())
                        vol.extendBounds(childVol.min, childVol.max);
                }

                return vol;
            },

            collectDrawableObjects: function (transform, drawableCollection, singlePath, invalidateCache, planeMask)
            {
                if (singlePath && (this._parentNodes.length > 1))
                    singlePath = false;

                if (singlePath && (invalidateCache = invalidateCache || this.cacheInvalid()))
                    this.invalidateCache();

                if (!this._cf.shape.node ||
                    (planeMask = drawableCollection.cull(transform, this.graphState(), singlePath, planeMask)) <= 0) {
                    return;
                }

                var cnode, childTransform;

                if (singlePath) {
                    if (!this._graph.globalMatrix) {
                        this._graph.globalMatrix = this.transformMatrix(transform);
                    }
                    childTransform = this._graph.globalMatrix;
                }
                else {
                    childTransform = this.transformMatrix(transform);
                }

                if ( (cnode = this._cf.shape.node) ) {
                    cnode.collectDrawableObjects(childTransform, drawableCollection, singlePath, invalidateCache, planeMask);
                }
            }
        }
    )
);
