/** Drag data produced by a Component Library item. */
export interface LibraryDragData {
  source: 'component-library';
  /** LWC tag name, e.g. 'lightning-button' */
  componentType: string;
}

/** Drag data produced by a canvas BuilderNode being reordered or moved. */
export interface CanvasDragData {
  source: 'canvas';
  nodeId: string;
  /** LWC tag name — included to allow canDrop validation without a store lookup. */
  componentType: string;
}

export type BuilderDragData = LibraryDragData | CanvasDragData;
