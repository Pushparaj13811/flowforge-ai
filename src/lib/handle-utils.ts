import type { NodeType } from '@/lib/validation';

export interface HandlePosition {
  x: number;
  y: number;
  angle: number;
  label?: string;
  type: 'center' | 'fan-left' | 'fan-center' | 'fan-right' | 'arc';
  semanticType?: 'yes' | 'no' | 'success' | 'error' | 'default';
}

export interface HandleDistribution {
  handles: HandlePosition[];
  centroid: { x: number; y: number };
  maxSpread: number;
  strategy: 'center' | 'fan' | 'arc' | 'conditional';
}

const HANDLE_RADIUS = 8; // Visual radius of handle circle
const FAN_SPREAD_ANGLE = 100; // Max angle spread for fan distribution (degrees)
const MIN_HANDLE_SPACING = 40; // Minimum pixel distance between handles

/**
 * Calculates optimal handle positions based on edge count and node type
 * Returns a distribution strategy optimized for visual clarity
 */
export function calculateHandlePositions(
  edgeCount: number,
  nodeType: NodeType,
  nodeX: number,
  nodeY: number,
  nodeWidth: number = 220,
  nodeHeight: number = 85
): HandleDistribution {
  // Special case: condition nodes always have Yes/No
  if (nodeType === 'condition') {
    return calculateConditionHandles(nodeX, nodeY, nodeWidth, nodeHeight, edgeCount);
  }

  // Single edge: center bottom
  if (edgeCount <= 1) {
    return {
      handles: [
        {
          x: nodeX + nodeWidth / 2,
          y: nodeY + nodeHeight,
          angle: 270,
          type: 'center',
          semanticType: 'default',
        },
      ],
      centroid: { x: nodeX + nodeWidth / 2, y: nodeY + nodeHeight },
      maxSpread: 0,
      strategy: 'center',
    };
  }

  // Two edges: side-by-side at bottom
  if (edgeCount === 2) {
    const spacing = MIN_HANDLE_SPACING;
    const centerX = nodeX + nodeWidth / 2;
    const baseY = nodeY + nodeHeight;

    return {
      handles: [
        {
          x: centerX - spacing / 2,
          y: baseY,
          angle: 270,
          type: 'fan-left',
          semanticType: 'default',
        },
        {
          x: centerX + spacing / 2,
          y: baseY,
          angle: 270,
          type: 'fan-right',
          semanticType: 'default',
        },
      ],
      centroid: { x: centerX, y: baseY },
      maxSpread: spacing,
      strategy: 'fan',
    };
  }

  // 3-5 edges: fan distribution (wider spread)
  if (edgeCount >= 3 && edgeCount <= 5) {
    return calculateFanDistribution(nodeX, nodeY, nodeWidth, nodeHeight, edgeCount);
  }

  // 6+ edges: arc distribution (expands beyond bottom)
  return calculateArcDistribution(nodeX, nodeY, nodeWidth, nodeHeight, edgeCount);
}

/**
 * Condition nodes have Yes/No handles plus potential additional branches
 */
function calculateConditionHandles(
  nodeX: number,
  nodeY: number,
  nodeWidth: number,
  nodeHeight: number,
  totalEdges: number
): HandleDistribution {
  const baseY = nodeY + nodeHeight;
  const leftX = nodeX + nodeWidth * 0.3;
  const rightX = nodeX + nodeWidth * 0.7;
  const centerX = nodeX + nodeWidth / 2;

  const handles: HandlePosition[] = [
    {
      x: leftX,
      y: baseY,
      angle: 270,
      label: 'Yes',
      type: 'fan-left',
      semanticType: 'yes',
    },
    {
      x: rightX,
      y: baseY,
      angle: 270,
      label: 'No',
      type: 'fan-right',
      semanticType: 'no',
    },
  ];

  // Additional branches beyond Yes/No
  if (totalEdges > 2) {
    const additionalCount = totalEdges - 2;
    const additionalHandles = calculateAdditionalHandles(
      centerX,
      baseY + 40,
      additionalCount,
      'arc'
    );
    handles.push(...additionalHandles);
  }

  return {
    handles,
    centroid: { x: centerX, y: baseY },
    maxSpread: Math.max(
      Math.abs(leftX - rightX),
      totalEdges > 2 ? 60 : 0
    ),
    strategy: 'conditional',
  };
}

/**
 * Fan distribution for 3-5 edges (emphasized at bottom)
 */
function calculateFanDistribution(
  nodeX: number,
  nodeY: number,
  nodeWidth: number,
  nodeHeight: number,
  edgeCount: number
): HandleDistribution {
  const centerX = nodeX + nodeWidth / 2;
  const baseY = nodeY + nodeHeight;

  // Calculate angle spread based on edge count
  const angleStep = Math.min(FAN_SPREAD_ANGLE / (edgeCount - 1), 25);
  const startAngle = -(angleStep * (edgeCount - 1)) / 2;

  const handles: HandlePosition[] = [];
  const radius = 50; // Distance from center to handles

  for (let i = 0; i < edgeCount; i++) {
    const angle = startAngle + angleStep * i;
    const radians = (angle + 270) * (Math.PI / 180); // 270 is bottom

    const x = centerX + radius * Math.cos(radians);
    const y = baseY + radius * Math.sin(radians);

    handles.push({
      x,
      y,
      angle: angle + 270,
      type: i === 0 ? 'fan-left' : i === edgeCount - 1 ? 'fan-right' : 'fan-center',
      semanticType: 'default',
    });
  }

  return {
    handles,
    centroid: { x: centerX, y: baseY },
    maxSpread: edgeCount * MIN_HANDLE_SPACING,
    strategy: 'fan',
  };
}

/**
 * Arc distribution for 6+ edges (wraps around right side)
 */
function calculateArcDistribution(
  nodeX: number,
  nodeY: number,
  nodeWidth: number,
  nodeHeight: number,
  edgeCount: number
): HandleDistribution {
  const centerX = nodeX + nodeWidth / 2;
  const centerY = nodeY + nodeHeight / 2;
  const radius = Math.max(nodeHeight / 2 + 30, 60);

  // Arc spans from bottom (270°) to right side (0°)
  const startAngle = 270;
  const totalSpan = 270; // Degrees to sweep

  const angleStep = totalSpan / Math.max(edgeCount - 1, 1);

  const handles: HandlePosition[] = [];

  for (let i = 0; i < edgeCount; i++) {
    const angle = startAngle + angleStep * i;
    const radians = angle * (Math.PI / 180);

    const x = centerX + radius * Math.cos(radians);
    const y = centerY + radius * Math.sin(radians);

    handles.push({
      x,
      y,
      angle,
      type: 'arc',
      semanticType: 'default',
    });
  }

  return {
    handles,
    centroid: { x: centerX, y: centerY },
    maxSpread: radius * 2,
    strategy: 'arc',
  };
}

/**
 * Calculate additional handles beyond the main distribution
 */
function calculateAdditionalHandles(
  centerX: number,
  baseY: number,
  count: number,
  type: 'arc' | 'fan'
): HandlePosition[] {
  const handles: HandlePosition[] = [];
  const angleStep = 180 / (count + 1);

  for (let i = 1; i <= count; i++) {
    const angle = angleStep * i;
    const radians = angle * (Math.PI / 180);
    const radius = 50;

    handles.push({
      x: centerX + radius * Math.cos(radians),
      y: baseY + radius * Math.sin(radians),
      angle: angle - 90,
      type: type === 'arc' ? 'arc' : 'fan-center',
      semanticType: 'default',
    });
  }

  return handles;
}

/**
 * Calculate bezier curve adjustment for parallel edges
 * Detects if multiple edges share same source/target and spreads them apart
 */
export function calculateEdgeAdjustment(
  sourceHandle: HandlePosition,
  targetPosition: { x: number; y: number },
  parallelEdgeCount: number = 1,
  edgeIndex: number = 0
): {
  sourceX: number;
  sourceY: number;
  controlX1: number;
  controlY1: number;
  controlX2: number;
  controlY2: number;
  targetX: number;
  targetY: number;
} {
  const sourceX = sourceHandle.x;
  const sourceY = sourceHandle.y;
  const targetX = targetPosition.x;
  const targetY = targetPosition.y;

  // Vertical distance determines control point depth
  const deltaY = Math.abs(targetY - sourceY);
  const baseControlOffset = Math.min(deltaY * 0.5, 80);

  // For parallel edges, apply lateral offset
  let lateralOffset = 0;
  if (parallelEdgeCount > 1) {
    const maxOffset = 30;
    const step = (maxOffset * 2) / (parallelEdgeCount - 1);
    lateralOffset = -maxOffset + step * edgeIndex;
  }

  // Calculate control points for smooth bezier
  const controlX1 = sourceX;
  const controlY1 = sourceY + baseControlOffset;
  const controlX2 = targetX + lateralOffset;
  const controlY2 = targetY - baseControlOffset;

  return {
    sourceX,
    sourceY,
    controlX1,
    controlY1,
    controlX2,
    controlY2,
    targetX,
    targetY,
  };
}

/**
 * Get semantic label for edge based on source handle type
 */
export function getHandleLabel(
  semanticType?: 'yes' | 'no' | 'success' | 'error' | 'default'
): string | undefined {
  const labels: Record<string, string> = {
    yes: 'Yes',
    no: 'No',
    success: 'Success',
    error: 'Error',
    default: '',
  };
  return labels[semanticType ?? 'default'];
}

/**
 * Get color for semantic type
 */
export function getSemanticColor(
  semanticType?: 'yes' | 'no' | 'success' | 'error' | 'default'
): string {
  const colors: Record<string, string> = {
    yes: 'var(--flow-green)',
    no: 'var(--destructive)',
    success: 'var(--flow-green)',
    error: 'var(--destructive)',
    default: 'var(--muted-foreground)',
  };
  return colors[semanticType ?? 'default'];
}
