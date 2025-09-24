## TcHmi3dDynamics

This project illustrates the use of a 3D environment <[babylonjs](https://www.babylonjs.com/)> in TwinCAT HMI.

The framework project wraps the babylon environment in a configurable control, allowing users to import and render their own 3D models ([supported formats](https://doc.babylonjs.com/features/featuresDeepDive/importers/loadingFileTypes)).

Scaling, position and rotation properties for each model can be bound to dynamic values (symbols) to provide real-time animation. The HMI project's symbol update rate is used to interpolate frames and smooth these animations.

There are two projects / solutions: 
- **TcHmi3dDynamics**: The framework project / control, and associated types
- **3dDynamics_Test**: Test project with models to show implementation

### Instructions:
- Add a reference to the TcHmi3dDynamics framework project (or package)
- Drop a `Dynamic Scene` control onto your page
- Add models to the `Mesh List` property of the control
- Apply any static or dynamic translations (position, rotation, scaling)
    - Enable the `Animation` property for real-time animations
    - Create parent/child hierarchy between models via the `Parent` property
        - Simply reference the parent mesh name
        - Make sure the referenced parent mesh *before* any children
- Configure the `Scene Options` properties to dial in the camera / aux options

### Sample
The test project includes 7 STL model files that make up a 6-axis robot arm. The models are added to the mesh list, with scaling, position, and rotation translations applied so everything is appropriately aligned. Internal symbols tied to the slider controls are used for the rotations so that the motion of each joint can be animated.

<img src="media/sample.gif" />
<br /><br />

> Note: STL models do not carry coordinate system information, which is why the rotations seem to be applied to the wrong axes (e.g. the first joint should rotate about the Z axis in right-hand rule, but the rotation is applied to the Y axis because the model and world coord systems are not the same). If you import a model with an appropriately defined coordinate system, everything should align correctly. You can always invert the model's system by negating the X or Z scaling.