let camera, scene, renderer, orbitControls
let aspectRatio, viewSize

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x00008B );

    // Create renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Create camera
    camera = new THREE.OrthographicCamera(
        -180, // X-
        180, // X+
        90, // Y+
        -90, // Y-
        -1, // Scene Z
        5  // Camera Z
    );
    scene.add( camera );
    orbitControls = new THREE.OrbitControls( camera, renderer.domElement );
    orbitControls.enableRotate = false;
    orbitControls.enableZoom = false;    

    camera.zoom = 1;
    camera.updateProjectionMatrix();
  
    // Load Map
    // instantiate a loader
    const strokeMaterial = new THREE.LineBasicMaterial({
        color: "#FFFFFF",
    });
    const loader = new THREE.SVGLoader();

    // load a SVG resource
    loader.load(
        // resource URL
        './map/no-margin_id.svg',
        // called when the resource is loaded
        function ( data ) {

            const paths = data.paths;
            const group = new THREE.Group();

            // Convert to 1 by 1
            group.scale.x *= 1/800;
            group.scale.y *= - 1/387;

            // Move center of 1 by 1 to 0,0
            group.position.x -= 180;
            group.position.y += 90;

            // Stretch to lat long accurate
            group.scale.x *= 360;
            group.scale.y *= 173.4;

            group.position.y -= 6.6;

            for ( let i = 0; i < paths.length; i ++ ) {
                const path = paths[ i ];
                const shapes = THREE.SVGLoader.createShapes( path );

                const material = new THREE.MeshBasicMaterial( {
                    color: 0x808080,
                    side: THREE.DoubleSide,
                    depthWrite: false
                } );

                for ( let j = 0; j < shapes.length; j ++ ) {
                    const shape = shapes[ j ];
                    const geometry = new THREE.ShapeGeometry( shape );
                    const linesGeometry = new THREE.EdgesGeometry(geometry);
                    const lines = new THREE.LineSegments(linesGeometry, strokeMaterial);
                    lines.renderOrder = 999;
                    lines.onBeforeRender = function( renderer ) { renderer.clearDepth(); };
                    group.add( lines );

                    const mesh = new THREE.Mesh( geometry, material );
                    mesh.name = path.userData.node.id;
				    group.add( mesh );
                }
            }
            scene.add( group );

            const groupLeft = new THREE.Group();
            const groupRight = new THREE.Group();
            
            groupLeft.copy(group, true);
            groupRight.copy(group, true);

            groupLeft.position.x -= 360
            groupRight.position.x += 360

            scene.add(groupLeft);
            scene.add(groupRight);
            
        },

        // called when loading is in progresses
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },

        // called when loading has errors
        function ( error ) {
            console.log( error );
        }
    );

    // Add LA
    addLoc(-118.2437 ,34.0522);    
}

function animate() {
    if(camera.position.x >= 360  || camera.position.x <= -360) {
        camera.position.x = 0;
        orbitControls.target.x = 0;
        camera.updateProjectionMatrix();
    }

    camera.position.y = 0;
    orbitControls.target.y = 0;
    camera.updateProjectionMatrix();

    orbitControls.update();
    requestAnimationFrame( animate );    
    renderer.render( scene, camera );
}

// Key Controls
document.onkeydown = function(e) {
    // Path visibility
    if (e.key === 'ArrowLeft') {
        camera.position.x -= 1;
        orbitControls.target.x -= 1;
        camera.updateProjectionMatrix()
    }
    else if (e.key === 'ArrowRight') {
        camera.position.x += 1;
        orbitControls.target.x += 1;
        camera.updateProjectionMatrix()
    }
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2()
document.addEventListener('mousemove', onDocumentMouseMove, false);
document.addEventListener( 'mousedown', onDocumentMouseDown, false );

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const cam_offset = new THREE.Vector2(camera.position.x, camera.position.y);

    let logX = mouse.x * 180 + cam_offset.x;
    if(logX > 180) {
        logX -= 360;
    }
    if(logX < -180) {
        logX += 360;
    }
    let logY = mouse.y * 90 + cam_offset.y;

    document.getElementById('coords').innerText = `X: ${(logX)}\nY: ${logY}`;
}

function onDocumentMouseDown( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( scene.children );  

    for( intersection of intersects ) {
        if(intersection.object.type === "Mesh") {
            console.log(intersection.object.name);
        }
    }
}

// Window Resizing
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function addLoc(long, lat) {
    // Drop some points
    for( let i = 0; i < 3; i++ ) {
        const geometry = new THREE.BoxGeometry( 1, 1, 1 );
        const material = new THREE.MeshBasicMaterial( {color: 0xFF0000} );
        const mesh = new THREE.Mesh( geometry, material );
        
        let long_mod = long;

        if (i == 0) {
            long_mod -= 360;
        }
        else if (i == 1) {
            long_mod += 360;
        }
        
        mesh.position.set( long_mod, lat, 0);
        scene.add( mesh );
    }
}