export interface MeshBuffers {
	solid: {
		positions: Float32Array;
		normals: Float32Array;
		uvs: Float32Array;
		indices: Uint32Array;
	};
	transparent: {
		positions: Float32Array;
		normals: Float32Array;
		uvs: Float32Array;
		indices: Uint32Array;
	};
}
