
export enum PipelineStage {
  SKETCH_PREP = "Sketch Preprocessing",
  MESH_PREP = "Mesh Preprocessing",
  PAIRING = "Silhouette Pairing",
  TRAINING = "Model Training",
  OUTPUT = "Generating Output Mesh",
}

export interface PipelineStatus {
  currentStage: PipelineStage | null;
  completedStages: Set<PipelineStage>;
}
