import { AgentNode } from './AgentNode';
import { ConditionNode } from './ConditionNode';
import { OutputNode } from './OutputNode';
import { TriggerNode } from './TriggerNode';

export { AgentNode, ConditionNode, OutputNode, TriggerNode };

/** React Flow node type registry */
export const nodeTypes = {
  'trigger-node': TriggerNode,
  'agent-node': AgentNode,
  'transform-node': AgentNode, // reuse AgentNode UI with different gradient
  'condition-node': ConditionNode, // handles condition, merge, delay
  'output-node': OutputNode,
} as const;
