// Keep these lines for a best effort IntelliSense of Visual Studio 2017 and higher.
/// <reference path="./../../Packages/Beckhoff.TwinCAT.HMI.Framework.14.2.110/runtimes/native1.12-tchmi/TcHmi.d.ts" />

/*
 * Generated 1/15/2025 11:37:47 AM
 * Copyright (C) 2025
 */
var TcHmi;
(function (/** @type {globalThis.TcHmi} */ TcHmi) {
    let Controls;
    (function (/** @type {globalThis.TcHmi.Controls} */ Controls) {
        let TcHmi3dDynamics;
        (function (TcHmi3dDynamics) {
            class DynamicScene extends TcHmi.Controls.System.TcHmiControl {

                /*
                 Attribute philosophy
                 --------------------
                 - Local variables are not set in the class definition, so they have the value 'undefined'.
                 - During compilation, the Framework sets the value that is specified in the HTML or in the theme (possibly 'null') via normal setters.
                 - Because of the "changed detection" in the setter, the value is only processed once during compilation.
                 - Attention: If we have a Server Binding on an Attribute, the setter will be called once with null to initialize and later with the correct value.
                 */

                /**
                 * Constructor of the control
                 * @param {JQuery} element Element from HTML (internal, do not use)
                 * @param {JQuery} pcElement precompiled Element (internal, do not use)
                 * @param {TcHmi.Controls.ControlAttributeList} attrs Attributes defined in HTML in a special format (internal, do not use)
                 * @returns {void}
                 */
                constructor(element, pcElement, attrs) {
                    /** Call base class constructor */
                    super(element, pcElement, attrs);

                    // internal fields
                    this.__engine = null;
                    this.__scene = null;
                    this.__meshList = [];
                    this.__meshMap = new Map();
                    this.__loadingMeshes = false;

                    this.__sceneOptions = {
                        cameraRadius: 1,
                        wheelPrecision: 100,
                        showCoordAxis: true,
                        coordAxisSize: 0.1
                    };
                    this.__coordAxis = null;

                    this.__sceneBgColor = null;

                    // animation
                    this.__wsInterval = 500;
                }
                /**
                 * Raised after the control was added to the control cache and the constructors of all base classes were called.
                 * This function is only to be used by the System. Other function calls are not intended.
                 */
                __previnit() {
                    // Fetch template root element
                    this.__elementTemplateRoot = this.__element.find('.TcHmi_Controls_TcHmi3dDynamics_DynamicScene-Template');
                    if (this.__elementTemplateRoot.length === 0) {
                        throw new Error('Invalid Template.html');
                    }

                    this.__elementCanvas = this.__elementTemplateRoot.find('.babylon_scene').get(0);
                    if (this.__elementCanvas) {
                        this.__engine = new BABYLON.Engine(this.__elementCanvas, true);
                    }

                    // websocket update rate effects animation framing
                    const config = TcHmi.Config.get();
                    this.__wsInterval = config.tcHmiServer.websocketIntervalTime;

                    this.__createScene();

                    // Call __previnit of base class
                    super.__previnit();
                }
                /**
                 * Is called during control initialization after the attribute setters have been called. 
                 * This function is only to be used by the System. Other function calls are not intended.
                 * @returns {void}
                 */
                __init() {
                    super.__init();
                }
                /**
                 * Is called by the system after the control instance is inserted into the active DOM.
                 * This function is only to be used by the System. Other function calls are not intended.
                 */
                __attach() {
                    this.__engine?.resize();
                    super.__attach();
                    /**
                     * Initialize everything which is only available while the control is part of the active dom.
                     */
                }
                /**
                 * Is called by the system when the control instance is no longer part of the active DOM.
                 * This function is only to be used by the System. Other function calls are not intended.
                 */
                __detach() {
                    super.__detach();

                    /**
                     * Disable everything that is not needed while the control is not part of the active DOM.
                     * For example, there is usually no need to listen for events!
                     */
                }
                /**
                 * Destroy the current control instance.
                 * Will be called automatically if the framework destroys the control instance!
                 */
                destroy() {
                    /**
                     * Ignore while __keepAlive is set to true.
                     */
                    if (this.__keepAlive) {
                        return;
                    }
                    super.destroy();
                    /**
                     * Free resources like child controls etc.
                     */
                }

                __createScene() {
                    if (this.__engine) {
                        // init scene
                        const scene = new BABYLON.Scene(this.__engine);
                        scene.createDefaultCameraOrLight(true, true, true);
                        scene.actionManager = new BABYLON.ActionManager(scene);

                        scene.useRightHandedSystem = true;

                        // axis viewer
                        this.__coordAxis = new BABYLON.Debug.AxesViewer(scene, 1);

                        // render loop
                        this.__engine.runRenderLoop(function () {
                            scene.render();
                        });

                        this.__scene = scene;
                    }
                }

                async __importMeshes(meshes) {

                    // prevent concurrent calls
                    if (this.__loadingMeshes) return;
                    this.__loadingMeshes = true;

                    // clear active meshes
                    if (this.__meshMap.size) {
                        this.__meshMap.values().forEach(m => m.dispose());
                        this.__meshMap.clear();
                    }

                    // calculate animation frames per second
                    // number of key frames * (1000ms / HMI update interval)
                    const fps = 2 * (1000 / this.__wsInterval);

                    for (const mesh of meshes) {
                        if (mesh.path) {
                            // import
                            const imported = await BABYLON.SceneLoader.ImportMeshAsync(null, mesh.path);
                            const m = imported.meshes[0];

                            // mesh properties
                            m.id = mesh.meshName;

                            // parent/child relationship
                            if (mesh.parent) {
                                const parent = this.__meshMap.get(mesh.parent);
                                if (parent) {
                                    m.setParent(parent);
                                }
                            }

                            // apply initial properties
                            m.scaling = new BABYLON.Vector3(mesh.scaling.x, mesh.scaling.y, mesh.scaling.z);
                            m.position = new BABYLON.Vector3(mesh.position.x, mesh.position.y, mesh.position.z);
                            m.rotation = new BABYLON.Vector3(mesh.rotation.x * Math.PI / 180, mesh.rotation.y * Math.PI / 180, mesh.rotation.z * Math.PI / 180);

                            // create animation keyframes
                            if (mesh.animate) {
                                ["position", "rotation", "scaling"].forEach(prop => {
                                    const animation = new BABYLON.Animation(prop, prop, fps, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                                    animation.setKeys([{ frame: 0, value: m[prop] }, { frame: 1, value: m[prop] }]);
                                    m.animations.push(animation);
                                });
                            }

                            this.__meshMap.set(m.id, m);
                        }
                    }

                    this.__loadingMeshes = false;
                }

                __updateMeshList(meshes) {
                    
                    this.__meshList = meshes;

                    // mesh count changed, re-import
                    if (meshes.length !== this.__meshMap.size) {
                        this.__importMeshes(meshes);
                        return;
                    }

                    if (meshes?.length && this.__scene) {

                        const scene = this.__scene;

                        meshes.forEach(mesh => {
                            const m = scene.meshes.find(x => x.id === mesh.meshName);
                            if (!m) return;

                            // animations
                            if (mesh.animate) {

                                // position
                                if (m.animations[0]) {
                                    const posKeys = m.animations[0].getKeys();
                                    posKeys[0].value = m.position;
                                    posKeys[1].value = new BABYLON.Vector3(mesh.position.x, mesh.position.y, mesh.position.z);
                                }

                                // rotation
                                if (m.animations[1]) {
                                    const rotKeys = m.animations[1].getKeys();
                                    rotKeys[0].value = m.rotation;
                                    rotKeys[1].value = new BABYLON.Vector3(
                                        mesh.rotation.x * Math.PI / 180,
                                        mesh.rotation.y * Math.PI / 180,
                                        mesh.rotation.z * Math.PI / 180
                                    );
                                }

                                // scaling
                                if (m.animations[2]) {
                                    const sclKeys = m.animations[2].getKeys();
                                    sclKeys[0].value = m.scaling;
                                    sclKeys[1].value = new BABYLON.Vector3(mesh.scaling.x, mesh.scaling.y, mesh.scaling.z);
                                }

                                scene.beginAnimation(m, 0, 1);

                            } else {
                                // basic translation
                                m.position.x = mesh.position.x;
                                m.position.y = mesh.position.y;
                                m.position.z = mesh.position.z;

                                m.rotation = BABYLON.Vector3.Zero();
                                m.rotate(BABYLON.Axis.X, mesh.rotation.x * Math.PI / 180, BABYLON.Space.WORLD);
                                m.rotate(BABYLON.Axis.Y, mesh.rotation.y * Math.PI / 180, BABYLON.Space.WORLD);
                                m.rotate(BABYLON.Axis.Z, mesh.rotation.z * Math.PI / 180, BABYLON.Space.WORLD);

                                m.scaling.x = mesh.scaling.x;
                                m.scaling.y = mesh.scaling.y;
                                m.scaling.z = mesh.scaling.z;
                            }
                        });
                    }
                }

                __updateSceneOptions(options) {
                    this.__sceneOptions = options;
                    if (!this.__scene) return;

                    this.__scene.cameras[0].radius = this.__sceneOptions.cameraRadius;
                    this.__scene.cameras[0].wheelPrecision = this.__sceneOptions.wheelPrecision;

                    this.__coordAxis?.dispose();
                    this.__coordAxis = null;
                    if (this.__sceneOptions.showCoordAxis) {
                        this.__coordAxis = new BABYLON.Debug.AxesViewer(this.__scene, this.__sceneOptions.coordAxisSize);
                    }
                }

                __hmiColorToBablyonColor(hmiColor) {
                    if (hmiColor == null) return;
                    const [r, g, b, a] = hmiColor.color.match(/[\d\.]+/g).map(Number);
                    return new BABYLON.Color4((r / 255), (g / 255), (b / 255), a);
                }

                // facilitates binding object property members
                __resolveObjectProperty(propertyName, value, processFn) {

                    // get state references
                    const parent = this;
                    
                    let convertedValue = TcHmi.ValueConverter.toObject(value);
                    if (convertedValue === null) {
                        // if we have no value to set we have to fall back to the defaultValueInternal from description.json
                        convertedValue = this.getAttributeDefaultValueInternal(propertyName);
                    }

                    let resolverInfo = this.__objectResolvers.get(propertyName);
                    if (resolverInfo) {
                        if (resolverInfo.watchDestroyer) {
                            resolverInfo.watchDestroyer();
                        }
                        resolverInfo.resolver.destroy();
                    }

                    let resolver = new TcHmi.Symbol.ObjectResolver(convertedValue);
                    this.__objectResolvers.set(propertyName, {
                        resolver: resolver,
                        watchCallback: callbackFn,
                        watchDestroyer: resolver.watch(callbackFn)
                    });

                    // object resolver callback
                    function callbackFn(data) {
                        if (parent.__isAttached === false) { // While not attached attribute should only be processed once during initializing phase.
                            parent.__suspendObjectResolver(propertyName);
                        }

                        if (data.error !== TcHmi.Errors.NONE) {
                            TcHmi.Log.error('[Source=Control, Module=TcHmi.Controls.System.TcHmiControl, Id=' +
                                parent.getId() + ', Attribute=Value] Resolving symbols from object failed with error: ' + TcHmi.Log.buildMessage(data.details));
                            return;
                        }

                        if (processFn) {
                            processFn.bind(parent)(data.value);
                            TcHmi.EventProvider.raise(parent.__id + '.onPropertyChanged', { propertyName: propertyName });
                        }
                    }
                }

                getMeshList() {
                    return this.__meshList;
                }

                setMeshList(value) {
                    this.__resolveObjectProperty('meshList', value, this.__updateMeshList);
                }

                getSceneOptions() {
                    return this.__sceneOptions;
                }

                setSceneOptions(value) {
                    this.__resolveObjectProperty('sceneOptions', value, this.__updateSceneOptions);
                }

                getSceneBgColor() {
                    return this.__sceneBgColor;
                }

                setSceneBgColor(value) {
                    this.__sceneBgColor = value;
                    if (value) this.__scene.clearColor = this.__hmiColorToBablyonColor(this.__sceneBgColor);
                }
            }
            TcHmi3dDynamics.DynamicScene = DynamicScene;
        })(TcHmi3dDynamics = Controls.TcHmi3dDynamics || (Controls.TcHmi3dDynamics = {}));
    })(Controls = TcHmi.Controls || (TcHmi.Controls = {}));
})(TcHmi || (TcHmi = {}));

/*
 * Register Control
 */
TcHmi.Controls.registerEx('DynamicScene', 'TcHmi.Controls.TcHmi3dDynamics', TcHmi.Controls.TcHmi3dDynamics.DynamicScene);
